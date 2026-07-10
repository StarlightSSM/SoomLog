// src/app/category/category-list.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuestionView } from '@/components/features/question-view'

type Category = { id: string; name: string; slug: string }
type Question = { id: string; content: string; difficulty: number }
type Stats = {
  total: number
  completed: number
  avgDifficulty: number | null
  lastUpdated: string | null
}
type ModelAnswer = { level: number; content: string }
type ExistingAnswer = { id: string; content: string } | null

export function CategoryList({ categories }: { categories: Category[] }) {
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // 인라인 문제 화면 상태
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [existingAnswer, setExistingAnswer] = useState<ExistingAnswer>(null)
  const [modelAnswers, setModelAnswers] = useState<ModelAnswer[]>([])
  const [questionLoading, setQuestionLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setActiveQuestion(null) // 카테고리 바꾸면 문제 화면 닫기

    const load = async () => {
      const { data: qs } = await supabase
        .from('questions')
        .select('id, content, difficulty, created_at')
        .eq('category_id', selectedId)
        .order('created_at')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      let completed = 0
      let doneSet = new Set<string>()
      if (user && qs && qs.length > 0) {
        const { data: answers } = await supabase
          .from('user_answers')
          .select('question_id')
          .eq('user_id', user.id)
          .in('question_id', qs.map((q) => q.id))

        doneSet = new Set(answers?.map((a) => a.question_id) ?? [])
        completed = doneSet.size
      }

      const total = qs?.length ?? 0
      const avgDifficulty =
        total > 0
          ? qs!.reduce((sum, q) => sum + (q.difficulty ?? 0), 0) / total
          : null
      const lastUpdated =
        total > 0
          ? qs!.reduce(
              (latest, q) => (q.created_at > latest ? q.created_at : latest),
              qs![0].created_at
            )
          : null

      setQuestions(qs ?? [])
      setCompletedIds(doneSet)
      setStats({ total, completed, avgDifficulty, lastUpdated })
      setLoading(false)
    }

    load()
  }, [selectedId])

  const openQuestion = async (q: Question) => {
    setQuestionLoading(true)
    setActiveQuestion(q)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const [{ data: existing }, { data: models }] = await Promise.all([
      user
        ? supabase
            .from('user_answers')
            .select('id, content')
            .eq('user_id', user.id)
            .eq('question_id', q.id)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('model_answers')
        .select('level, content')
        .eq('question_id', q.id)
        .order('level'),
    ])

    setExistingAnswer(existing)
    setModelAnswers(models ?? [])
    setQuestionLoading(false)
  }

  const closeQuestion = () => {
    setActiveQuestion(null)
    // 목록으로 돌아올 때 완료 상태 최신화
    if (selectedId) {
      const cat = selectedId
      setSelectedId(null)
      setTimeout(() => setSelectedId(cat), 0)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="mb-6 text-2xl font-semibold">카테고리</h1>

      <div className="flex gap-6">
        <div className="w-64 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedId(cat.id)}
              className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                selectedId === cat.id
                  ? 'bg-blue-50 font-medium text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-6">
          {/* 문제 화면이 열려있으면 이것만 보여주고, 아니면 통계+목록 */}
          {activeQuestion ? (
            <div>
              <button
                onClick={closeQuestion}
                className="mb-4 text-sm text-gray-500 hover:text-gray-700"
              >
                ← 목록으로
              </button>
              {questionLoading ? (
                <p className="text-sm text-gray-400">불러오는 중...</p>
              ) : (
                <QuestionView
                  question={activeQuestion}
                  existingAnswer={existingAnswer}
                  modelAnswers={modelAnswers}
                />
              )}
            </div>
          ) : (
            <>
              <div className="rounded-2xl border p-6">
                {loading || !stats ? (
                  <p className="text-sm text-gray-400">불러오는 중...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <StatCard label="총 문제" value={`${stats.total}개`} />
                    <StatCard label="완료 문제" value={`${stats.completed}개`} />
                    <StatCard
                      label="평균 난이도"
                      value={
                        stats.avgDifficulty !== null
                          ? '⭐'.repeat(Math.round(stats.avgDifficulty))
                          : '-'
                      }
                    />
                    <StatCard
                      label="최근 업데이트"
                      value={
                        stats.lastUpdated
                          ? new Date(stats.lastUpdated).toLocaleDateString('ko-KR')
                          : '-'
                      }
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border p-6">
                <h2 className="mb-4 font-medium text-gray-700">문제 목록</h2>
                <div className="space-y-2">
                  {questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => openQuestion(q)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{q.content}</span>
                      <span className="text-xs">
                        {completedIds.has(q.id) ? (
                          <span className="text-green-600">✔ 완료</span>
                        ) : (
                          <span className="text-gray-300">미완료</span>
                        )}
                      </span>
                    </button>
                  ))}
                  {questions.length === 0 && !loading && (
                    <p className="text-sm text-gray-400">
                      아직 등록된 문제가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}