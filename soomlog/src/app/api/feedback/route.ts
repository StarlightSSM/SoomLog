// src/app/api/feedback/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const USE_MOCK = process.env.OPENAI_MOCK === 'true'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }

  const { userAnswerId, question, answer } = await request.json()

  if (!userAnswerId || !question || !answer) {
    return NextResponse.json(
      { error: '필수 값이 누락됐습니다.' },
      { status: 400 }
    )
  }

  const { data: ownedAnswer } = await supabase
    .from('user_answers')
    .select('id')
    .eq('id', userAnswerId)
    .eq('user_id', user.id)
    .single()

  if (!ownedAnswer) {
    return NextResponse.json(
      { error: '권한이 없습니다.' },
      { status: 403 }
    )
  }

  let feedback

  if (USE_MOCK) {
    feedback = {
      score: 84,
      communication: 4,
      technical: 5,
      accuracy: 4,
      depth: 3,
      strengths: '핵심 개념을 정확히 언급했고 설명이 논리적이었습니다.',
      weaknesses: '실제 사례나 트레이드오프에 대한 언급이 부족했습니다.',
      follow_up_questions: [
        '실제 프로젝트에서 이 개념을 어떻게 적용해보셨나요?',
        '이 방식의 단점은 무엇이라고 생각하시나요?',
        '대안이 될 수 있는 다른 방법이 있을까요?',
      ],
    }
  } else {
    const prompt = `당신은 기술 면접관입니다. 아래 질문과 지원자의 답변을 평가해주세요.

질문: ${question}
지원자 답변: ${answer}

다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "score": 0-100 사이 정수,
  "communication": 1-5 사이 정수,
  "technical": 1-5 사이 정수,
  "accuracy": 1-5 사이 정수,
  "depth": 1-5 사이 정수,
  "strengths": "좋았던 점을 한국어로 2-3문장",
  "weaknesses": "부족한 점을 한국어로 2-3문장",
  "follow_up_questions": ["꼬리질문1", "꼬리질문2", "꼬리질문3"]
}`

    try {
      const response = await fetch(
        `${process.env.OLLAMA_BASE_URL}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL ?? 'qwen3:8b',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            stream: false,
            format: 'json',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()

      feedback = JSON.parse(data.message?.content ?? '{}')
    } catch (err) {
      console.error('Ollama error:', err)

      return NextResponse.json(
        { error: 'AI 평가 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: saved, error: insertError } = await serviceSupabase
    .from('ai_feedbacks')
    .insert({
      user_answer_id: userAnswerId,
      score: feedback.score,
      communication: feedback.communication,
      technical: feedback.technical,
      accuracy: feedback.accuracy,
      depth: feedback.depth,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      follow_up_questions: feedback.follow_up_questions,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)

    return NextResponse.json(
      { error: '저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ feedback: saved })
}