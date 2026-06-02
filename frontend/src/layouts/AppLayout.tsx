import { Outlet } from "react-router-dom"

export default function AppLayout() {
    return (
        <>
            <div>
                AppLayout
            </div>
            <Outlet/> /*👈​agregamos de react router dom Outlet para que se muestre como layout*/
        </>
    )
}