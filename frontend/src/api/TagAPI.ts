import api from "@/lib/axios"
import { tagListSchema } from "@/types"
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
    }
}
