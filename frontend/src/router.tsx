import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AppLayout from "./layouts/AppLayout"
import DashboardView from "./views/DashboardView"
import CreateMovementView from "./views/movements/CreateMovementView"
import MovementView from "./views/movements/MovementView"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

export default function Router() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardView/>} index />
                        <Route path="/movements" element={<MovementView/>} />
                        <Route path="/movements/create" element={<CreateMovementView />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}