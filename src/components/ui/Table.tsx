import type { ReactNode } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  className?: string
  width?: string
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  highlightedIds?: Set<string>
  getRowId?: (item: T) => string
}

export function Table<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Tidak ada data',
  onSort,
  sortKey,
  sortDirection,
  highlightedIds = new Set(),
  getRowId
}: TableProps<T>) {
  
  const handleSort = (key: string) => {
    if (!onSort) return
    if (sortKey === key) {
      onSort(key, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(key, 'asc')
    }
  }

  return (
    <div className="w-full overflow-x-auto border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)]">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[var(--color-bg)] sticky top-0 z-10 border-b border-[var(--color-border)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  "py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:text-[var(--color-text-primary)] transition-colors"
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  )}
                  {col.sortable && sortKey !== col.key && (
                    <ArrowUp size={14} className="opacity-0 group-hover:opacity-30" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="border-b border-[var(--color-border)] last:border-0">
                {columns.map((col) => (
                  <td key={`skeleton-col-${col.key}`} className="py-3 px-4">
                    <Skeleton variant="text" width="100%" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => {
              const id = getRowId ? getRowId(item) : String(idx)
              const isHighlighted = highlightedIds.has(id)
              
              return (
                <tr
                  key={id}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-0 transition-colors duration-200 hover:bg-[var(--color-accent-soft)]/50",
                    idx % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-bg)]/30",
                    isHighlighted && "animate-[highlight-fade_1s_ease-out]"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("py-3 px-4 text-sm text-[var(--color-text-primary)]", col.className)}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
