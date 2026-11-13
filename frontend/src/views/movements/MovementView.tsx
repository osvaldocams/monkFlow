import { useMemo } from "react"
import { useMovements } from "@/hooks/useMovements"
import PageHeader from "@/components/ui/PageHeader"
import MovementsList from "@/components/movements/MovementsList"


export default function MovementView() {
  const {
    data,
    isLoading,
    isError,
    errorMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useMovements()

  const movements = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const total = data?.pages[0]?.meta.total ?? 0

  if (isLoading) return <p>Cargando...</p>
  if (isError && !data) return <div className="p-6 text-rose-500 font-semibold">🚨 Error: {errorMessage}</div>
  if (!data) return null
  return (
    <>
      <PageHeader
        title="Mis Movimientos"
        description="Crea y Administra tus Movimientos"
        backTo="/movements/create"
        backLabel="Crear Movimiento"

      />
      {movements.length ? (
        <MovementsList
          movements={movements}
          total={total}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isFetchNextPageError={isFetchNextPageError}
          onLoadMore={() => fetchNextPage()}
        />
      ) : (
        <p className="text-gray-500">No hay movimientos registrados aun</p>
      )}
    </>
  )
}
