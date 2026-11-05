import api from "@/lib/axios"
import { handleApiError } from "./handleApiErrors"
import { accountBalanceListSchema, type AccountBalanceList } from "@/types"


export const AccountAPI = {
    getAccounts: async (): Promise<AccountBalanceList> => {
        try {
            const { data } = await api.get("/accounts")
            const response = accountBalanceListSchema.safeParse(data)
            if (!response.success) {
                throw new Error("invalid account format")
            }
            return response.data
        } catch (error) {
            //debbugging logs for development only
            handleApiError(error, "Error fetching accounts")
        }
    }
}
