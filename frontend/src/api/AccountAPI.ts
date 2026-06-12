import api from "@/lib/axios"
import { accountListSchema } from "@/types"
import { handleApiError } from "./handleApiErrors"


export const AccountAPI = {
    getAccounts: async () => {
        try {
            const { data } = await api.get("/accounts")
            const response = accountListSchema.safeParse(data)
            if(!response.success){
                throw new Error("invalid account format")
            }
            return response.data
        } catch (error) {
            //debbugging logs for development only
            handleApiError(error, "Error fetching accounts")
        }
    }
}