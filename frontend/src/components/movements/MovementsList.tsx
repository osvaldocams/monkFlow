import { MOVEMENT_TYPES } from "@/constants/movementTypes"
import { formatCurrency } from "@/helpers/formatCurrency"
import { formatDate } from "@/helpers/formatDate"
import type { Movement, MovementType } from "@/types"
import { Link } from "react-router-dom"
import { Calendar, Eye, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"


interface MovementsListProps {
    movements: Movement[]
    total: number
    hasNextPage: boolean
    isFetchingNextPage: boolean
    isFetchNextPageError: boolean
    onLoadMore: () => void
}


const TYPE_ICONS: Record<MovementType, React.ReactNode> = {
    INCOME: <ArrowDownLeft className="w-3.5 h-3.5" />,
    EXPENSE: <ArrowUpRight className="w-3.5 h-3.5" />,
    TRANSFER: <ArrowLeftRight className="w-3.5 h-3.5" />,
    DEPOSIT: <ArrowDownToLine className="w-3.5 h-3.5" />,
    WITHDRAWAL: <ArrowUpFromLine className="w-3.5 h-3.5" />,
}

export default function MovementsList({
    movements,
    total,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    onLoadMore,
}: MovementsListProps) {
    return (
        <div className="bg-white rounded-lg shadow-md border border-linen-light">

            {/* HEADER */}
            <div className="p-5 border-b border-linen-light">
                <h3 className="text-xl font-semibold text-obsidian">Movimientos Recientes</h3>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-5">
                {movements.map((movement) => {
                    const config = MOVEMENT_TYPES[movement.type as MovementType]
                    return (
                        <div
                            key={movement.id}
                            className="border border-linen-light rounded-lg p-4 hover:shadow-md transition-all hover:border-gray-300" >
                            {/* card header */}
                            <div className="flex items-start justify-between mb-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                    {TYPE_ICONS[movement.type as MovementType]}
                                    {config.label}
                                </span>
                                <span className="text-xs text-obsidian flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(new Date(movement.date))}
                                </span>
                            </div>

                            {/* Monto */}
                            <p className="text-2xl font-bold text-obsidian mb-3">
                                {formatCurrency(movement.amount)}
                            </p>

                            {/* descripcion */}
                            <p className="text-sm text-obsidian mb-4 line-clamp-2 min-h-10">
                                {movement.description || 'Sin descripción'}
                            </p>

                            {/* cuentas */}
                            {(movement.incomeAccount || movement.expenseAccount) && (
                                <div className="mb-3 pb-3 border-b border-gray-100">
                                    {movement.type === 'INCOME' || movement.type === 'EXPENSE' ? (
                                        <p className="text-xs text-clay-gray">
                                            <span className="font-medium">
                                                {movement.incomeAccount?.name || movement.expenseAccount?.name}
                                            </span>
                                        </p>
                                    ) : (
                                        <div className="text-xs text-clay-gray space-y-1">
                                            <p>
                                                <span className="font-medium">De:</span>{' '}
                                                <span className="capitalize text-obsidian">{movement.expenseAccount?.name}</span>
                                            </p>
                                            <p>
                                                <span className="font-medium">A:</span>{' '}
                                                <span className="capitalize text-obsidian">{movement.incomeAccount?.name}</span>
                                            </p>
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* boton ver */}
                            <Link
                                to={`/movements/${movement.id}`}
                                className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-green-balance hover:bg-green-balance-opaque rounded-lg transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                ver detalle
                            </Link>

                        </div>
                    )
                })

                }
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-linen-light bg-gray-50 text-left text-xs font-semibold text-clay-gray uppercase tracking-wide">
                            <th className="px-5 py-3">Tipo</th>
                            <th className="px-5 py-3">Fecha</th>
                            <th className="px-5 py-3 hidden lg:table-cell">Descripción</th>
                            <th className="px-5 py-3">Origen</th>
                            <th className="px-5 py-3">Destino</th>
                            <th className="px-5 py-3 text-right">Monto</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-linen-light">
                        {movements.map((movement) => {
                            const config = MOVEMENT_TYPES[movement.type as MovementType]
                            return (
                                <tr
                                    key={movement.id}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    {/* tipo */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                            {TYPE_ICONS[movement.type as MovementType]}
                                            {config.label}
                                        </span>
                                    </td>

                                    {/* fecha */}
                                    <td className="px-5 py-4 whitespace-nowrap text-obsidian">
                                        <span className="flex items-center gap-1.5 text-clay-gray">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            {formatDate(new Date(movement.date))}
                                        </span>
                                    </td>

                                    {/* descripcion */}
                                    <td className="px-5 py-4 max-w-[200px] hidden lg:table-cell">
                                        <span>
                                            {movement.description || (
                                                <span className="text-clay-gray italic">Sin descripcion</span>
                                            )}
                                        </span>
                                    </td>

                                    {/* origen (expenseAccount) */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        {movement.expenseAccount ? (
                                            <span className="text-obsidian capitalize">{movement.expenseAccount.name}</span>
                                        ) : (
                                            <span className="text-clay-gray">-</span>
                                        )}
                                    </td>

                                    {/* destino (incomeAccount) */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        {movement.incomeAccount ? (
                                            <span className="text-obsidian capitalize">{movement.incomeAccount.name}</span>
                                        ) : (
                                            <span className="text-clay-gray">-</span>
                                        )}
                                    </td>

                                    {/* monto */}
                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                        <span className="font-semibold text-obsidian tabular-nums">
                                            {formatCurrency(movement.amount)}
                                        </span>
                                    </td>

                                    {/* accion */}
                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                        <Link
                                            to={`/movements/${movement.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-balance hover:bg-green-balance-opaque rounded-lg transition-colors group-hover:opacity-100"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col items-center gap-2 border-t border-linen-light px-5 py-6">
                {hasNextPage ? (
                    <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={isFetchingNextPage}
                        aria-busy={isFetchingNextPage}
                        className="inline-flex items-center gap-2 rounded-full border border-linen-light bg-white px-5 py-2 text-sm font-medium text-clay-gray transition-colors hover:border-sage hover:text-green-balance focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-wait disabled:opacity-60"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando...
                            </>
                        ) : isFetchNextPageError ? (
                            'Reintentar'
                        ) : (
                            'Cargar más'
                        )}
                    </button>
                ) : (
                    movements.length > 0 && (
                        <p className="text-xs tracking-wide text-clay-gray" aria-live="polite">
                            Has llegado al final del historial
                        </p>
                    )
                )}

                <p className="text-[11px] text-clay-gray">
                    Mostrando {movements.length} de {total}
                </p>
            </div>
        </div>
    )
}
