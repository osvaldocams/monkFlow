import { useMovements } from "@/hooks/useMovements"
import PageHeader from "@/components/ui/PageHeader"
import MovementsList from "@/components/movements/MovementsList"


export default function MovementView() {
  const { data, isLoading, isError, errorMessage } = useMovements()

  if (isLoading) return <p>Cargando...</p>
  if (isError) return <div className="p-6 text-rose-500 font-semibold">🚨 Error: {errorMessage}</div>
  if (!data) return null
  return (
    <>
      <PageHeader
        title="Mis Movimientos"
        description="Crea y Administra tus Movimientos"
        backTo="/movements/create"
        backLabel="Crear Movimiento"

      />
      {data.length ? (
        <MovementsList
          movements={data}
        />
      ) : (
        <p className="text-gray-500">No hay movimientos registrados aun</p>
      )}
    </>
  )
}
