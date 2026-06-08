'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RowError {
  row: number
  errors: string[]
}

export function ImportTransactionsDialog() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rowErrors, setRowErrors] = useState<RowError[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRowErrors([])
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  async function handleImport() {
    if (!selectedFile) return
    setLoading(true)
    setRowErrors([])
    try {
      const body = new FormData()
      body.append('file', selectedFile)
      const res = await fetch('/api/transactions/import', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok) {
        if (json.rowErrors) {
          setRowErrors(json.rowErrors)
        } else {
          toast.error(json.error ?? 'Import failed')
        }
      } else {
        toast.success(`${json.data.imported} transactions imported`)
        setOpen(false)
        setSelectedFile(null)
        router.refresh()
      }
    } catch {
      toast.error('Import failed')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setRowErrors([])
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4" />
          Import CSV / Excel
        </Button>
      } />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Transactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Required columns</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><span className="font-mono">type</span> — <code>income</code> or <code>expense</code></li>
              <li><span className="font-mono">amount</span> — positive number (e.g. <code>1500.50</code>)</li>
              <li><span className="font-mono">date</span> — <code>YYYY-MM-DD</code> format</li>
              <li><span className="font-mono">category_id</span> — UUID (optional, copy from Categories page)</li>
              <li><span className="font-mono">description</span> — any text up to 500 chars (optional)</li>
            </ul>
            <p className="pt-1">Max 500 rows per upload. All rows must be valid — no partial imports.</p>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:text-xs file:font-medium file:bg-background file:text-foreground hover:file:bg-accent cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
            )}
          </div>

          {rowErrors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                {rowErrors.length} row{rowErrors.length !== 1 ? 's' : ''} failed validation — fix and re-upload
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {rowErrors.map(({ row, errors }) => (
                  <div key={row} className="text-xs">
                    <span className="font-medium">Row {row}:</span>{' '}
                    <span className="text-muted-foreground">{errors.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!selectedFile || loading}
            onClick={handleImport}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
