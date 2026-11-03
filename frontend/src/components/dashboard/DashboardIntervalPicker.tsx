import type { DashboardInterval } from '@/types'
import React from 'react'


interface DashboardIntervalPickerProps {
    value: DashboardInterval
    onChange: (interval: DashboardInterval) => void
}


export default function DashboardIntervalPicker({ value, onChange, }: DashboardIntervalPickerProps): React.JSX.Element {
    return (
        <div className="inline-flex items-center p-1 bg-zinc-900/80 border border-zinc-800 rounded-full backdrop-blur-sm">
            <button
                type='button'
                onClick={() => onChange('week')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ease-in-out ${value === 'week'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
            >
                Semana
            </button>

            <button
                type='button'
                onClick={() => onChange('month')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ease-in-out ${value === 'month'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
            >
                Mes
            </button>
        </div>
    )
}
