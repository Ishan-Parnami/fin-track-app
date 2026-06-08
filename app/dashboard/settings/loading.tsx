import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function loading() {
  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-5 w-72 mt-0.5" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="space-y-8">

          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-44 mt-0.5" />
            </div>
            <div className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-9" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-48 mt-0.5" />
            </div>
            <div className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-7 w-32" />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
