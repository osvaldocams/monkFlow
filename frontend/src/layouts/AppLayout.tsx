import { Outlet, Link } from "react-router-dom"
import { Menu, X, LogOut, User,  } from "lucide-react"

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            {/* header */}
            <header className="sticky top-0 z-30 bg-obsidian shadow-md">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-sage hover:bg-clay-gray hover:text-linen-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-linen-light"
                            onClick={() => {}}
                        >
                            <span className="sr-only">Abrir menú</span>
                                <X className="block h-6 w-6" aria-hidden="true" />
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                        </button>
                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <div className="text-linen-light text-xl sm:text-2xl font-bold">
                                💰 MonkFlow
                            </div>
                        </Link>
                        {/* user menu */}
                        <div className="flex items-center gap-3">
                            <button className="hidden sm:flex items-center gap-2 rounded-lg border border-clay-gray bg-obsidian px-3 py-2 text-sm font-medium nth-2:text-linen-light nth-1:text-sage nth-1:hover:text-linen-light hover:bg-clay-gray transition-colors">
                                <User className="h-4 w-4 " />
                                <span className="hidden md:inline">Mi cuenta</span>
                            </button>
                            <button className="rounded-lg bg-obsidian p-2 text-sage border border-clay-gray hover:border-ritual-red hover:text-linen-light hover:bg-ritual-red transition-colors">
                                <LogOut className="h-5 w-5" />
                                <span className="sr-only">Cerrar sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>




            <Outlet/>
            <footer className="hidden lg:block border-t border-clay-gray bg-linen-light">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-obsidian">
                        © {new Date().getFullYear()} MonkFlow. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
