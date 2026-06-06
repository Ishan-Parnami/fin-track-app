import { redirect } from 'next/navigation'
import { eq, isNull, or, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { CategoryCard } from '@/components/categories/CategoryCard'
import { AddCategoryDialog } from '@/components/categories/AddCategoryDialog'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/EmptyState'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const userId = session.user.id

  const allCategories = await db.query.categories.findMany({
    where: or(isNull(categories.userId), eq(categories.userId, userId)),
    orderBy: [desc(categories.isDefault)],
  })

  const incomeCategories = allCategories.filter((c) => c.type === 'income')
  const expenseCategories = allCategories.filter((c) => c.type === 'expense')

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Default categories are shared across all users. Custom ones are yours only.
          </p>
        </div>
        <AddCategoryDialog />
      </div>

      {allCategories.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No categories yet"
          description="Add a category to start organizing your transactions."
        />
      ) : (
        <>
          {incomeCategories.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-emerald-500">Income</h3>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {incomeCategories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </section>
          )}

          {expenseCategories.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-amber-500">Expenses</h3>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expenseCategories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
