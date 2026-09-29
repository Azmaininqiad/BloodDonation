import type { UrgencyLevel } from '@/types/database'

interface Props {
  urgency: UrgencyLevel
}

const config: Record<UrgencyLevel, { label: string; classes: string }> = {
  high: { label: 'High urgency',  classes: 'bg-red-100 text-red-800 border border-red-300' },
  mid:  { label: 'Mid urgency',   classes: 'bg-amber-100 text-amber-800 border border-amber-300' },
  low:  { label: 'Low urgency',   classes: 'bg-green-100 text-green-800 border border-green-300' },
}

export function UrgencyBadge({ urgency }: Props) {
  const { label, classes } = config[urgency]
  return (
    <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${classes}`}>
      {label}
    </span>
  )
}
