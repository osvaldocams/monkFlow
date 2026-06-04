import api from "@/lib/axios"
import { movementListSchema, type MovementList } from "@/types"
import { handleApiError } from "./handleApiErrors"

export const MovementAPI = {
    /** 
     * obtener la colección completa de movimientos desde el backend
     * validando las respuestas con Zod para asegurar la integridad de los datos en el frontend
    */
    getMovements: async(): Promise<MovementList> => {
        try {
            const {data} = await api.get("/movements")
            //validamos la estructura exacta que viene del backend
            const response = movementListSchema.safeParse(data)
            if(!response.success){
                if(import.meta.env.DEV){
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
    }
}