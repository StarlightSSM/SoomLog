// src/components/features/question-view.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Question = { id: string; content: string; difficulty: number }
type ModelAnswer = { level: number; content: string }
type ExistingAnswer = { id: string; content: string } | null

export function QuestionView({
  question,
  existingAnswer,
  modelAnswers,
}: {
  question: Question
  existingAnswer: ExistingAnswer
  modelAnswers: ModelAnswer[]
}) {
  const [answer, setAnswer] = useState(existingAnswer?.content ?? '')
  const [unlocked, setUnlocked] = useState(!!existingAnswer)
  const [submitting, setSubmitting] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_answers').insert({
      user_id: user.id,
      question_id: question.id,
      content: answer,
    })

    setSubmitting(false)
    setUnlocked(true)
  }

  const levelLabels: Record<number, string> = {
    1: '⭐ 핵심 답변',
    2: '⭐⭐ 일반 답변',
    3: '⭐⭐⭐ 면접 답변',
    4: '⭐⭐⭐⭐ 심화 답변',
  }

  return (
    <div className="max-w-3xl bg-white">
      <p className="mb-2 text-xs text-gray-400">
        난이도 {'⭐'.repeat(question.difficulty)}
      </p>
      <h1 className="mb-6 text-xl font-semibold">{question.content}</h1>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={unlocked}
        placeholder="답변을 작성해주세요..."
        className="min-h-40 rounded-2xl"
      />

      {!unlocked && (
        <Button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="mt-4"
        >
          {submitting ? '제출 중...' : '제출하기'}
        </Button>
      )}

      <div className="mt-10 space-y-4">
        <LockedSection
          title="모범답안"
          unlocked={unlocked}
          content={
            modelAnswers.length > 0 ? (
              <div>
                <div className="mb-3 flex gap-2">
                  {modelAnswers.map((m) => (
                    <button
                      key={m.level}
                      onClick={() => setSelectedLevel(m.level)}
                      className={`rounded-full px-3 py-1 text-xs ${
                        selectedLevel === m.level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {levelLabels[m.level]}
                    </button>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-700">
                  {modelAnswers.find((m) => m.level === selectedLevel)
                    ?.content ?? '해당 난이도 답안이 아직 없습니다.'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">모범답안 준비 중입니다.</p>
            )
          }
        />

        <LockedSection
          title="AI 피드백"
          unlocked={unlocked}
          content={
            <p className="text-sm text-gray-400">
              AI 피드백 기능은 곧 연결됩니다. (다음 단계)
            </p>
          }
        />
      </div>
    </div>
  )
}

function LockedSection({
  title,
  unlocked,
  content,
}: {
  title: string
  unlocked: boolean
  content: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border p-6">
      <h2 className="mb-3 font-medium text-gray-700">
        {unlocked ? '🔓' : '🔒'} {title}
      </h2>
      {unlocked ? (
        content
      ) : (
        <p className="text-sm text-gray-400">답변을 작성하면 열립니다.</p>
      )}
    </div>
  )
}