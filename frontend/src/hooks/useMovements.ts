import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MovementAPI } from '@/api/MovementAPI'
import type { CreateMovementDto, Movement } from '@/types'
import { useNavigate } from 'react-router-dom'

//==============================================
//  hook para consultar lista de movimientos
//==============================================

export const useMovements = () => {
    const query = useQuery({ //1️⃣​
        queryKey: ['movements'],
        queryFn: MovementAPI.getMovements
    })
    return {
        ...query, // 2️⃣​
        errorMessage: query.error instanceof Error ? query.error.message : null
    }
}

//==============================================
//  hook para consultar movimiento por su id
//==============================================

export const useMovementById = (movementId: Movement['id']) => {
    const query = useQuery({
        queryKey: ['movements', movementId],
        queryFn: () => MovementAPI.getMovementById(movementId),
        enabled: !!movementId
    })
    return {
        ...query,
        errorMessage: query.error instanceof Error ? query.error.message : null
    }
}

//==============================================
//  hook para mutación/creación de nuevos movimientos
//==============================================
export const useCreateMovement = () => {//3️⃣ creamos nuestro hook para la mutación de creación de movimientos
    const queryClient = useQueryClient() //4️⃣ ​Para invalidar cache después de crear un movimiento

    return useMutation({ //5️⃣ usamos useMutation para manejar la creación de movimientos 
        mutationFn: (formData: CreateMovementDto) => MovementAPI.createMovement(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["movements"] })
            console.log("¡Movimiento creado con éxito en la base de datos!")
        },
        onError: (error) => {
            console.error("Error en la mutación:", error)
        }
    })
}

//==============================================
//  hook para mutación/eliminar movimientos
//==============================================
export const useDeleteMovement = () => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (id: Movement['id']) => MovementAPI.deleteMovement(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["movements"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            console.log("¡Movimiento creado con éxito en la base de datos!")
            navigate('/movements')
        },
        onError: (error) => {
            console.error("Error en la mutación:", error)
        }
    })
}
