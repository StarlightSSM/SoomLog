// src/app/category/page.tsx
import { createClient } from '@/lib/supabase/server'
import { CategoryList } from './category-list'

export default async function CategoryPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  return <CategoryList categories={categories ?? []} />
}