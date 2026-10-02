import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  icon?: ReactNode
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="info-card">
      <span className="label">{label}</span>
      <strong className="stat-card__value">
        {icon}
        {value}
      </strong>
    </div>
  )
}
