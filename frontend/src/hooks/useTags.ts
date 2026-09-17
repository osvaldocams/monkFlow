import { TagAPI } from "@/api/TagAPI"
import { useQuery } from "@tanstack/react-query"


//==============================================
//  hook para consultar lista de tags
//==============================================

export const useTags = () => {
    const query = useQuery({
        queryKey: ['tags'],
        queryFn: TagAPI.getTags,
        staleTime: 1000 * 60 * 5
    })
    return {
        ...query,
        errorMessage: query.error instanceof Error ? query.error.message : null
    }
}
