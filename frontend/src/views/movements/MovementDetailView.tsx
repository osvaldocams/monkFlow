import PageHeader from "@/components/ui/PageHeader";
import { useMovementById } from "@/hooks/useMovements";
import { ArrowLeft, Calendar, Plus, Tag, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";

export default function MovementDetailView() {

    const params = useParams()
    const movementId = params.movementId!

    const { data: movement, isLoading, error } = useMovementById(movementId || '')
    console.log(movement)
    return (
        <>
            <PageHeader
                title="Detalle del movimiento"
                description="Revisa y administra tu movimiento"
                backTo="/movements"
                backLabel="Mis Movimientos"
            />

            {/* contenedor principal responsive */}
            <div className="max-w-4xl mx-auto">

                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">

                    {/* header tipo y monto */}
                    <div className=" bg-clay-gray-opaque  p-6 sm:p-8 text-center border-b border-linen-light">
                        <span
                            className={`inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider bg-amber-100 text-blue-950} mb-3 shadow-sm`}>
                            movement label (dummy)
                        </span>
                        <h2 className="text-4xl sm:text-5xl font-bold text-obsidian mb-2">
                            {movement?.amount} hello
                        </h2>
                        {/* dummy data iteration */}
                        <p className="text-obsidian text-sm sm:text-base mt-2 italic max-w-md mx-auto">
                            "{movement?.description}"
                        </p>
                    </div>

                    {/* detalles */}
                    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

                        {/* grid responsive de detalles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                            {/* fecha */}
                            <div className="flex items-star gap-3 p-4 bg-gray-50 rounded-50">
                                <div className="shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Calendar className="w-5 h-5 text-obsidian" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-clay-gray uppercase tracking-wide">
                                        Fecha
                                    </p>
                                    <p className="text-sm sm:text-base font-medium text-obsidian mt-1">
                                        12/02/1987 (dummy)
                                    </p>
                                </div>
                            </div>

                            {/* cuentas */}
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                <div className="shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <ArrowLeft className="w-5 h-5 text-obsidian" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-clay-gray uppercase tracking-wide mb-1">Cuentas</p>
                                    {/* dummy lleva iteracion */}
                                    <div className="text.sm">
                                        <span className="text-obsidian font-medium">
                                            Entra a:
                                        </span>
                                        <span>
                                            BBVA (dummy)
                                        </span>

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <hr className="border-clay-gray" />

                    {/* seccion de tags */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-obsidian">
                                <Tag className="w-5 h-5" />
                                <span className="font-semibold text-base">Etiquetas</span>
                            </div>
                            <button className="flex items-center gap-1.5 text-xs sm:text-sm text-green-balance font-bold cursor-pointer hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Añadir
                            </button>
                        </div>
                        {/* parte pendiente */}
                    </div>

                    <hr className="border-clay-gray" />

                    {/* acciones */}
                    <button
                        onClick={() => { }}
                        /*  disabled= {isDeleting} */
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar Movimiento</span>
                    </button>

                </div>

                {/* Información adicional */}
                <div className="mt-6 p-4 bg-sage-opaque border border-sage rounded-lg">
                    <p className="text-sm text-green-balance">
                        <span className="font-medium">💡 Consejo:</span> Añade etiquetas para una mejor organización.
                    </p>
                </div>

            </div>
        </>
    )
}

