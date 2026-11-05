import type { DashboardInterval } from '@/types'


interface DashboardIntervalPickerProps {
    value: DashboardInterval
    onChange: (interval: DashboardInterval) => void
}


export default function DashboardIntervalPicker({ value, onChange, }: DashboardIntervalPickerProps) {

    const base = 'px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-balance focus-visible:ring-offset-1'
    const active = 'bg-green-balance text-linen-light shadow-sm'
    const inactive = 'text-obsidian hover:bg-sage-opaque'

    return (
        <div className="inline-flex items-center gap-1 p-1 bg-white border border-linen-light rounded-full" role="group" aria-label="Intervalo del dashboard">
            <button
                type='button'
                onClick={() => onChange('week')}
                className={`${base} ${value === 'week' ? active : inactive}`}
                aria-pressed={value === 'week'}
            >
                Semana
            </button>

            <button
                type='button'
                onClick={() => onChange('month')}
                className={`${base} ${value === 'month' ? active : inactive}`}
                aria-pressed={value === 'month'}
            >
                Mes
            </button>
        </div>
    )
}
