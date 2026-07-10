// src/components/features/question-editor-board.tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Category = { id: string; name: string; slug: string }
type Question = {
  id: string
  category_id: string
  content: string
  difficulty: number
  order_index: number
}
type ModelAnswer = { id: string; question_id: string; level: number; content: string }

const LEVEL_LABELS: Record<number, string> = {
  1: '⭐ 핵심 답변',
  2: '⭐⭐ 일반 답변',
  3: '⭐⭐⭐ 면접 답변',
  4: '⭐⭐⭐⭐ 심화 답변',
}

export function QuestionEditorBoard({
  categories,
  initialQuestions,
  initialModelAnswers,
}: {
  categories: Category[]
  initialQuestions: Question[]
  initialModelAnswers: ModelAnswer[]
}) {
  const supabase = createClient()
  const [questions, setQuestions] = useState(initialQuestions)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Question | null>(null)
  const [creatingInCategory, setCreatingInCategory] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const byCategory = (categoryId: string) =>
    questions
      .filter((q) => q.category_id === categoryId)
      .sort((a, b) => a.order_index - b.order_index)

  const findQuestion = (id: string) => questions.find((q) => q.id === id)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeQ = findQuestion(active.id as string)
    if (!activeQ) return

    // over.id가 카테고리 컬럼 id면 그 컬럼 맨 끝으로, 문제 카드 id면 그 카드 위치로 이동
    const overQ = findQuestion(over.id as string)
    const targetCategoryId = overQ ? overQ.category_id : (over.id as string)

    let updated = [...questions]

    if (activeQ.category_id !== targetCategoryId) {
      // 다른 카테고리로 이동
      const targetList = byCategory(targetCategoryId)
      const newOrderIndex = overQ
        ? targetList.findIndex((q) => q.id === overQ.id)
        : targetList.length

      updated = updated.map((q) =>
        q.id === activeQ.id
          ? { ...q, category_id: targetCategoryId, order_index: newOrderIndex }
          : q
      )

      await supabase
        .from('questions')
        .update({ category_id: targetCategoryId, order_index: newOrderIndex })
        .eq('id', activeQ.id)
    } else if (overQ && activeQ.id !== overQ.id) {
      // 같은 카테고리 내 순서 변경
      const list = byCategory(activeQ.category_id)
      const oldIndex = list.findIndex((q) => q.id === activeQ.id)
      const newIndex = list.findIndex((q) => q.id === overQ.id)
      const reordered = arrayMove(list, oldIndex, newIndex)

      const idToIndex = new Map(reordered.map((q, idx) => [q.id, idx]))
      updated = updated.map((q) =>
        idToIndex.has(q.id) ? { ...q, order_index: idToIndex.get(q.id)! } : q
      )

      await Promise.all(
        reordered.map((q, idx) =>
          supabase.from('questions').update({ order_index: idx }).eq('id', q.id)
        )
      )
    }

    setQuestions(updated)
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="mb-6 text-2xl font-semibold">문제 에디터</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {categories.map((cat) => (
            <CategoryColumn
              key={cat.id}
              category={cat}
              questions={byCategory(cat.id)}
              onAddClick={() => setCreatingInCategory(cat.id)}
              onCardClick={(q) => setEditing(q)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <QuestionCardView question={findQuestion(activeId)!} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {(editing || creatingInCategory) && (
        <QuestionFormDialog
          question={editing}
          categoryId={creatingInCategory ?? editing?.category_id ?? ''}
          modelAnswers={initialModelAnswers}
          onClose={() => {
            setEditing(null)
            setCreatingInCategory(null)
          }}
          onSaved={(saved, deleted) => {
            if (deleted) {
              setQuestions((prev) => prev.filter((q) => q.id !== deleted))
            } else if (saved) {
              setQuestions((prev) => {
                const exists = prev.some((q) => q.id === saved.id)
                return exists
                  ? prev.map((q) => (q.id === saved.id ? saved : q))
                  : [...prev, saved]
              })
            }
            setEditing(null)
            setCreatingInCategory(null)
          }}
        />
      )}
    </div>
  )
}

function CategoryColumn({
  category,
  questions,
  onAddClick,
  onCardClick,
}: {
  category: Category
  questions: Question[]
  onAddClick: () => void
  onCardClick: (q: Question) => void
}) {
  return (
    <div className="w-72 shrink-0 rounded-2xl bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-gray-700">{category.name}</h2>
        <button
          onClick={onAddClick}
          className="text-xs text-blue-600 hover:underline"
        >
          + 추가
        </button>
      </div>

      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
        id={category.id}
      >
        <div className="min-h-10 space-y-2">
          {questions.map((q) => (
            <SortableQuestionCard key={q.id} question={q} onClick={() => onCardClick(q)} />
          ))}
          {questions.length === 0 && (
            <DroppableEmptyZone categoryId={category.id} />
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function DroppableEmptyZone({ categoryId }: { categoryId: string }) {
  const { setNodeRef, isOver } = useSortable({ id: categoryId })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed p-4 text-center text-xs text-gray-300 ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
    >
      문제 없음 — 카드를 여기로 드래그
    </div>
  )
}

function SortableQuestionCard({
  question,
  onClick,
}: {
  question: Question
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <QuestionCardView question={question} onClick={onClick} />
    </div>
  )
}

function QuestionCardView({
  question,
  onClick,
}: {
  question: Question
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-grab rounded-xl bg-white p-3 text-sm shadow-sm active:cursor-grabbing"
    >
      <p className="mb-1 text-xs text-gray-400">{'⭐'.repeat(question.difficulty)}</p>
      <p className="text-gray-700">{question.content}</p>
    </div>
  )
}

function QuestionFormDialog({
  question,
  categoryId,
  modelAnswers,
  onClose,
  onSaved,
}: {
  question: Question | null
  categoryId: string
  modelAnswers: ModelAnswer[]
  onClose: () => void
  onSaved: (saved: Question | null, deletedId?: string) => void
}) {
  const supabase = createClient()
  const [content, setContent] = useState(question?.content ?? '')
  const [difficulty, setDifficulty] = useState(String(question?.difficulty ?? 2))
  const [levels, setLevels] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = { 1: '', 2: '', 3: '', 4: '' }
    if (question) {
      modelAnswers
        .filter((m) => m.question_id === question.id)
        .forEach((m) => {
          initial[m.level] = m.content
        })
    }
    return initial
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)

    let savedQuestion: Question

    if (question) {
      const { data } = await supabase
        .from('questions')
        .update({ content, difficulty: Number(difficulty) })
        .eq('id', question.id)
        .select()
        .single()
      savedQuestion = data as Question
    } else {
      const { data } = await supabase
        .from('questions')
        .insert({
          category_id: categoryId,
          content,
          difficulty: Number(difficulty),
          order_index: 9999, // 맨 뒤에 배치, 필요시 나중에 드래그로 조정
        })
        .select()
        .single()
      savedQuestion = data as Question
    }

    // 모범답안 upsert (내용이 비어있지 않은 레벨만)
    const upserts = Object.entries(levels)
      .filter(([, v]) => v.trim())
      .map(([level, v]) => ({
        question_id: savedQuestion.id,
        level: Number(level),
        content: v,
      }))

    if (upserts.length > 0) {
      await supabase
        .from('model_answers')
        .upsert(upserts, { onConflict: 'question_id,level' })
    }

    setSaving(false)
    onSaved(savedQuestion)
  }

  const handleDelete = async () => {
    if (!question) return
    if (!confirm('이 문제를 삭제하시겠습니까? 모범답안도 함께 삭제됩니다.')) return

    await supabase.from('model_answers').delete().eq('question_id', question.id)
    await supabase.from('questions').delete().eq('id', question.id)
    onSaved(null, question.id)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? '문제 수정' : '새 문제 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">질문 내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600">난이도</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {'⭐'.repeat(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">모범답안 (선택)</p>
            {[1, 2, 3, 4].map((level) => (
              <div key={level}>
                <label className="mb-1 block text-xs text-gray-500">
                  {LEVEL_LABELS[level]}
                </label>
                <Textarea
                  value={levels[level]}
                  onChange={(e) =>
                    setLevels((prev) => ({ ...prev, [level]: e.target.value }))
                  }
                  className="min-h-16 text-sm"
                  placeholder="비워두면 해당 난이도는 저장 안 됨"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {question ? (
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving || !content.trim()}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}