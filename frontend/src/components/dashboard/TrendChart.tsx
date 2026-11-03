import type { DashboardInterval, DashboardTrendPoint } from '@/types'
import { formatCurrency } from '@/helpers/formatCurrency'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts'

interface TrendChartProps {
    trend: DashboardTrendPoint[]
    interval: DashboardInterval
}

const INCOME_COLOR = '#6a994e'   // green-balance
const EXPENSE_COLOR = '#d00000'  // ritual-red
const GRID_COLOR = '#e5e7eb'
const AXIS_COLOR = '#b2b8b8'     // clay-gray
const TEXT_COLOR = '#2d3436'     // obsidian

export default function TrendChart({ trend, interval }: TrendChartProps) {
    const subtitle = interval === 'week' ? 'Últimos 7 días' : 'Este mes'

    if (trend.length === 0) {
        return (
            <section className="bg-white rounded-lg border border-linen-light shadow-md p-5">
                <h3 className="text-xl font-semibold text-obsidian">Ingresos vs. Gastos</h3>
                <p className="text-sm text-clay-gray mt-2">Sin datos para este periodo.</p>
            </section>
        )
    }

    return (
        <section className="bg-white rounded-lg border border-linen-light shadow-md p-5 min-w-0">
            <header className="mb-4">
                <h3 className="text-xl font-semibold text-obsidian">Ingresos vs. Gastos</h3>
                <p className="text-xs text-clay-gray">{subtitle}</p>
            </header>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={trend}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        barGap={4}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                            width={56}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 12, color: TEXT_COLOR }}
                            iconType="circle"
                        />
                        <Bar
                            dataKey="income"
                            name="Ingresos"
                            fill={INCOME_COLOR}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                        />
                        <Bar
                            dataKey="expense"
                            name="Gastos"
                            fill={EXPENSE_COLOR}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(163, 201, 168, 0.3)' }}   // sage-opaque
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #f7f7f7',
                                borderRadius: '0.5rem',
                                color: TEXT_COLOR,
                                fontSize: 12,
                            }}
                            formatter={(value) => formatCurrency(Number(value ?? 0))}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    )
}
