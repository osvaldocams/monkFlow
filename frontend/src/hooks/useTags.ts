import { TagAPI } from "@/api/TagAPI"
import type { CreateTagDto } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"


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

//==============================================
//  hook para crear useTags
//==============================================

export const useCreateTags = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateTagDto) => TagAPI.createTag(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] })
        }
    })
}

