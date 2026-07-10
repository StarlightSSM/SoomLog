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

  const [feedback, setFeedback] = useState<{
    score: number
    communication: number
    technical: number
    accuracy: number
    depth: number
    strengths: string
    weaknesses: string
    follow_up_questions: string[]
  } | null>(null)

  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: inserted, error } = await supabase
      .from('user_answers')
      .insert({
        user_id: user.id,
        question_id: question.id,
        content: answer,
      })
      .select()
      .single()

    setSubmitting(false)
    setUnlocked(true)

    if (error || !inserted) return

    // AI 피드백 요청
    setFeedbackLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswerId: inserted.id,
          question: question.content,
          answer,
        }),
      })
      const data = await res.json()
      if (data.feedback) setFeedback(data.feedback)
    } catch (err) {
      console.error(err)
    } finally {
      setFeedbackLoading(false)
    }
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
            feedbackLoading ? (
              <p className="text-sm text-gray-400">AI가 답변을 평가하고 있습니다...</p>
            ) : feedback ? (
              <div className="space-y-4">
                <p className="text-2xl font-semibold text-blue-600">{feedback.score}점</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Communication {'★'.repeat(feedback.communication)}{'☆'.repeat(5 - feedback.communication)}</div>
                  <div>Technical {'★'.repeat(feedback.technical)}{'☆'.repeat(5 - feedback.technical)}</div>
                  <div>Accuracy {'★'.repeat(feedback.accuracy)}{'☆'.repeat(5 - feedback.accuracy)}</div>
                  <div>Depth {'★'.repeat(feedback.depth)}{'☆'.repeat(5 - feedback.depth)}</div>
                </div>

                <div>
                  <p className="text-xs font-medium text-green-600">좋았던 점</p>
                  <p className="text-sm text-gray-700">{feedback.strengths}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-500">부족한 점</p>
                  <p className="text-sm text-gray-700">{feedback.weaknesses}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">꼬리질문</p>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    {feedback.follow_up_questions?.map((q, i) => (
                      <li key={i}>Q{i + 1}. {q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">AI 피드백을 불러오지 못했습니다.</p>
            )
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