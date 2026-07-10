// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-semibold">
        안녕하세요 {profile?.nickname ?? '사용자'}님 👋
      </h1>
      <p className="mt-2 text-gray-500">{user.email}로 로그인됨</p>

      <div className="mt-8 rounded-2xl border p-6">
        <p className="text-sm text-gray-400">
          여기에 오늘의 추천 문제, 학습률, 최근 기록이 들어갈 예정입니다.
        </p>
      </div>
    </div>
  )
}