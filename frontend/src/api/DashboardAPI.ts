import api from "@/lib/axios";
import { dashboardSummaryResponseSchema, type DashboardInterval, type DashboardSummaryResponse } from "@/types";


export const DashboardAPI = {
    //obtener resumen financiero filtrado por intervalo
    getSummary: async (interval: DashboardInterval = 'month'): Promise<DashboardSummaryResponse> => {
        const response = await api.get('/dashboard/summary', {
            params: { interval }
        })
        //validar y parsear la respuesta
        return dashboardSummaryResponseSchema.parse(response.data)
    }
}
