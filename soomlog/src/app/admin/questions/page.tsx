// src/app/admin/questions/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuestionEditorBoard } from '@/components/features/question-editor-board'

export default async function AdminQuestionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  const { data: questions } = await supabase
    .from('questions')
    .select('id, category_id, content, difficulty, order_index')
    .order('order_index')

  const { data: modelAnswers } = await supabase
    .from('model_answers')
    .select('id, question_id, level, content')

  return (
    <QuestionEditorBoard
      categories={categories ?? []}
      initialQuestions={questions ?? []}
      initialModelAnswers={modelAnswers ?? []}
    />
  )
}