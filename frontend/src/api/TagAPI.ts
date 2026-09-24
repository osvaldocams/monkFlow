import api from "@/lib/axios"
import { tagListSchema, tagSchema, type CreateTagDto } from "@/types"
import { handleApiError } from "./handleApiErrors"


export const TagAPI = {
    getTags: async () => {
        try {
            const { data } = await api.get("/tags")
            const response = tagListSchema.safeParse(data)
            if (!response.success) {
                throw new Error("invalid tag format")
            }
            return response.data
        } catch (error) {
            handleApiError(error, "Error fetching tags")
        }
    },

    createTag: async (data: CreateTagDto) => {
        try {
            const { data: response } = await api.post("/tags", data)
            const result = tagSchema.safeParse(response)
            if (!result.success) {
                throw new Error("invalid tag response format")
            }
            return result.data
        } catch (error) {
            handleApiError(error, "Error creating tag", data)
        }
    }
}
