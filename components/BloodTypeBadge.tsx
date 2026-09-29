import type { BloodType } from '@/types/database'

interface Props {
  type: BloodType
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-3 py-1',
}

export function BloodTypeBadge({ type, size = 'md' }: Props) {
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-red-600 text-white ${sizeClasses[size]}`}
      aria-label={`Blood type ${type}`}
    >
      {type}
    </span>
  )
}
