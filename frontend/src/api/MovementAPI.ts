import api from "@/lib/axios"
import { movementListSchema, movementSchema, tagSchema, type CreateMovementDto, type Movement, type MovementList, type Tag } from "@/types"
import { handleApiError } from "./handleApiErrors"

export const MovementAPI = {
    createMovement: async (dtoData: CreateMovementDto) => {
        try {
            const { data } = await api.post("/movements", dtoData)
            return data
        } catch (error) {
            handleApiError(error, 'Error creating movement', dtoData)
        }
    },
    /** 
     * obtener la colección completa de movimientos desde el backend
     * validando las respuestas con Zod para asegurar la integridad de los datos en el frontend
    */
    getMovements: async (): Promise<MovementList> => {
        try {
            const { data } = await api.get("/movements")
            //validamos la estructura exacta que viene del backend
            const response = movementListSchema.safeParse(data)
            if (!response.success) {
                if (import.meta.env.DEV) {
                    console.error('⚠️ [Zod Validation Error]:', response.error.format())
                }
                //lanzamos un error explicito si la validación falla, para que el frontend pueda manejarlo adecuadamente
                throw new Error("data received from the server does not match the expected format")
            }
            return response.data
        } catch (error) {
            // Pasamos el error y el contexto explícito para tus logs del modo dev
            handleApiError(error, "MovementAPI.getMovements")
        }
    },
    getMovementById: async (id: Movement['id']): Promise<Movement> => {
        try {
            const { data } = await api.get(`/movements/${id}`)
            const response = movementSchema.safeParse(data)
            if (!response.success) {
                if (import.meta.env.DEV) {
                    console.log('validation error:', response.error.format())
                }
                throw new Error('The movement data is not in the expected format')
            }
            return response.data
        } catch (error) {
            //debuging logs for development only
            handleApiError(error, 'Error fetching movement', { id })
            throw error
        }

    },
    deleteMovement: async (id: Movement['id']): Promise<Movement> => {
        try {
            const { data } = await api.delete(`/movements/${id}`)
            return data
        } catch (error) {
            //debuging for development only
            handleApiError(error, 'Error deleting movement', { id })
        }
    },
    addTagToMovement: async (movementId: Movement['id'], tagId: Tag['id']): Promise<Tag> => {
        try {
            const { data } = await api.post(`/movements/${movementId}/tags`, { tagId })
            const result = tagSchema.safeParse(data.tag)
            if (!result.success) throw new Error('invalid tag response format')
            return result.data
        } catch (error) {
            handleApiError(error, 'Error adding tag to movement', { movementId, tagId })
        }
    },
    removeTagFromMovement: async (movementId: Movement['id'], tagId: Tag['id']): Promise<void> => {
        try {
            await api.delete(`/movements/${movementId}/tags/${tagId}`)
        } catch (error) {
            handleApiError(error, 'Error removing tag from movement', { movementId, tagId })
        }
    }

}
