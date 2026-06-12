import { AccountAPI } from "@/api/AccountAPI"
import { useQuery } from "@tanstack/react-query"

//==============================================
//  hook para consultar lista de cuentas
//==============================================


export const useAccounts = () => {
    const query = useQuery({ 
        queryKey: ['accounts'], 
        queryFn: AccountAPI.getAccounts,
        staleTime: 1000 * 60 * 5 // 5 minutos de cache para evitar consultas excesivas
    })
    return {
        ...query, // 2️⃣​
        errorMessage: query.error instanceof Error ? query.error.message : null
    }
}