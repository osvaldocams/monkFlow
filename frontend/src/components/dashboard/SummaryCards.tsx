import type { AccountBalanceList, DashboardSummaryResponse } from "@/types";
import type { ReactNode } from "react";
import { formatCurrency } from '@/helpers/formatCurrency'
import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from 'lucide-react'



interface SummaryCardsProps {
    data: DashboardSummaryResponse
    accounts: AccountBalanceList
}

//sub componente
interface CardProps {
    label: string
    value: string
    hint: string
    icon: ReactNode
    valueClassName?: string
}

function Card({ label, value, hint, icon, valueClassName = 'text-obsidian' }: CardProps) {
    return (
        <div className="bg-white rounded-lg border border-linen-light shadow-md p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-clay-gray">
                    {label}
                </span>
                <span className="text-sage">{icon}</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${valueClassName}`}>{value}</p>
            <p className="text-xs text-clay-gray">{hint}</p>
        </div>
    )
}

//componente
export default function SummaryCards({ data, accounts }: SummaryCardsProps) {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const { income, expense, balance } = data.summary

    const accountLabel = accounts.length === 1 ? 'cuenta' : 'cuentas'
    const movementLabel = data.movementsCount === 1 ? 'movimiento' : 'movimientos'



    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card
                label="Balance total"
                value={formatCurrency(totalBalance)}
                hint={`${accounts.length} ${accountLabel}`}
                icon={<Wallet className="h-4 w-4" />}
                valueClassName={totalBalance < 0 ? 'text-ritual-red' : 'text-obsidian'}
            />
            <Card
                label="Ingresos"
                value={formatCurrency(income)}
                hint="en el periodo"
                icon={<ArrowDownLeft className="h-4 w-4" />}
                valueClassName="text-green-balance"
            />
            <Card
                label="Gastos"
                value={formatCurrency(expense)}
                hint="en el periodo"
                icon={<ArrowUpRight className="h-4 w-4" />}
                valueClassName="text-ritual-red"
            />
            <Card
                label="Balance del periodo"
                value={formatCurrency(balance)}
                hint={`${data.movementsCount} ${movementLabel}`}
                icon={<Scale className="h-4 w-4" />}
                valueClassName={balance < 0 ? 'text-ritual-red' : 'text-obsidian'}
            />
        </div>
    )
}
