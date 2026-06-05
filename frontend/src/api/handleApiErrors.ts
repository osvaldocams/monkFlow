import { isAxiosError } from "axios"

type ValidationError = {
    location: string
    msg: string
    path: string
    type: string
    value: string
}

type ErrorResponse = {
    error?: string
    message?: string
    errors?: ValidationError[]
}

/**
 * Intercepta, procesa y unifica los errores de red (Axios) y de tiempo de ejecución
 * para entregar un mensaje de error limpio a TanStack React Query.
 */
export function handleApiError(error: unknown, context: string, sentData?: unknown): never {
    // Debugging logs estructurados solo en desarrollo
    if (import.meta.env.DEV) {
        console.group(`🔴 [API Error Context]: ${context}`)
        if (sentData) console.log('Data sent to API:', sentData)
    }

    // Tipamos de forma segura el interceptor de Axios usando su genérico interno
    if (isAxiosError<ErrorResponse>(error)) {
        if (error.response) {
            if (import.meta.env.DEV) {
                console.log('Status HTTP:', error.response.status)
                console.log('Response payload:', error.response.data)
                console.groupEnd()
            }

            const responseData = error.response.data
            
            // Extracción segura y priorizada de mensajes de error del backend
            const errorMessage = 
                (typeof responseData === 'object' && responseData !== null)
                    ? (responseData.errors?.[0]?.msg || responseData.error || responseData.message)
                    : null
            
            throw new Error(errorMessage || `Error ${error.response.status}: ${error.response.statusText}`)
        }

        if (error.request) {
            if (import.meta.env.DEV) {
                console.log('No response received from server')
                console.groupEnd()
            }
            throw new Error('No se pudo establecer conexión con el servidor de MonkFlow')
        }
    }

    if (import.meta.env.DEV) {
        console.log('Runtime or Unknown error:', error)
        console.groupEnd()
    }

    throw new Error(error instanceof Error ? error.message : 'Ocurrió un error inesperado')
}