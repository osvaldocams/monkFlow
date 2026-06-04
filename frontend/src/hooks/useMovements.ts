import { useQuery } from '@tanstack/react-query'
import { MovementAPI } from '@/api/MovementAPI'

export const useMovements = () => {
    const {data, isLoading, isError, error} = useQuery({
        queryKey: ['movements'], //identificador unico para el cache
        queryFn: MovementAPI.getMovements //el servicio
    })
    return {
        data,
        isLoading,
        isError,
        // Homologamos el mensaje extraído por nuestro controlador central de errores
        errorMessage: error instanceof Error ? error.message : null
    }
}