// src/app/signup/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const handleSignup = async () => {
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname }, // 트리거가 raw_user_meta_data에서 이 값을 읽음
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSubmitted(true) // "이메일을 확인해주세요" 화면으로 전환
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-sm space-y-3 rounded-2xl p-8 text-center">
          <h1 className="text-xl font-semibold">이메일을 확인해주세요</h1>
          <p className="text-sm text-gray-500">
            {email}로 인증 메일을 보냈습니다. 메일함에서 링크를 클릭하면
            가입이 완료됩니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-6 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold">SoomLog 회원가입</h1>

        <div className="space-y-3">
          <Input
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSignup} disabled={loading} className="w-full">
          {loading ? '가입 중...' : '가입하기'}
        </Button>
      </div>
    </div>
  )
}