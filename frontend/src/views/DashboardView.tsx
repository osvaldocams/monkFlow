
import { useMovements } from "@/hooks/useMovements"

export default function DashboardView() {
    const { data, isLoading, isError, errorMessage } = useMovements()

    if (isLoading) return <div className="p-6 text-sage animate-pulse">Cargando flujos de MonkFlow...</div>
    
    if (isError) return <div className="p-6 text-rose-500 font-semibold">🚨 Error: {errorMessage}</div>

    return (
        <div className="p-6 bg-stone-50 min-h-screen">
            <h1 className="text-2xl font-bold text-obsidian mb-4">Smoke Test: Capa de Lógica</h1>
            <pre className="bg-white p-4 border border-stone-200 rounded-lg overflow-auto max-h-96 text-xs text-stone-700">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}