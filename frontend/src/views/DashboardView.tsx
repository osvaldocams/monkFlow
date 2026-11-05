import { useState } from "react"
import type { DashboardInterval } from "@/types"
import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { useAccounts } from "@/hooks/useAccounts"
import DashboardIntervalPicker from "@/components/dashboard/DashboardIntervalPicker"
import SummaryCards from "@/components/dashboard/SummaryCards"
import TrendChart from "@/components/dashboard/TrendChart"
import { formatDate } from "@/helpers/formatDate"


const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 19) return "Buenas tardes"
    return "Buenas noches"
}

export default function DashboardView() {

    const [interval, setDashboardInterval] = useState<DashboardInterval>('month')

    const summaryQuery = useDashboardSummary(interval)
    const accountsQuery = useAccounts()

    const isLoading = summaryQuery.isLoading || accountsQuery.isLoading
    const isError = summaryQuery.isError || accountsQuery.isError
    const errorMessage =
        summaryQuery.error?.message ??
        accountsQuery.errorMessage ??
        "No se pudo cargar el dashboard"

    return (
        <section className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-obsidian">
                        {getGreeting()}
                    </h1>
                    <p className="mt-1 text-sm text-clay-gray">
                        Resumen de tus finanzas · {formatDate(new Date())}
                    </p>
                </div>
                <DashboardIntervalPicker value={interval} onChange={setDashboardInterval} />
            </header>

            {isLoading ? (
                <p className="text-sm text-sage animate-pulse">Cargando dashboard...</p>
            ) : isError ? (
                <div className="rounded-lg border border-ritual-red/30 bg-ritual-red-opaque p-4 text-sm font-medium text-ritual-red">
                    🚨 {errorMessage}
                </div>
            ) : summaryQuery.data && accountsQuery.data ? (
                <>
                    <SummaryCards data={summaryQuery.data} accounts={accountsQuery.data} />
                    <TrendChart trend={summaryQuery.data.trend} interval={interval} />
                </>
            ) : null}
        </section>
    )
}
