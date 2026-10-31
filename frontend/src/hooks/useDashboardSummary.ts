import { DashboardAPI } from "@/api/DashboardAPI";
import type { DashboardInterval } from "@/types";
import { useQuery } from "@tanstack/react-query";



export const useDashboardSummary = (interval: DashboardInterval = 'month') => {
    return useQuery({
        //incluir el intervalo en la key para que react-query cachee y refresque cuando el usuario cambie
        queryKey: ['dashboard-summary', interval],
        queryFn: () => DashboardAPI.getSummary(interval),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })
} 
