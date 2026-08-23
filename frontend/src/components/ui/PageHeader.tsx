import { Link } from "react-router-dom"

type PageHeaderProps = {
    title: string
    description?: string
    backTo?: string
    backLabel?: string
}

export default function PageHeader({
    title,
    description,
    backTo,
    backLabel = 'Volver',
}: PageHeaderProps) {
    return (
        <div className="mb-6 sm:mb-8">
            {/* Back button - Móvil sticky, desktop normal */}
            {backTo && (
                <nav className="mb-4 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-white sm:bg-transparent sm:border-0 sticky sm:static top-0 z-10">
                    <Link
                        to={backTo}
                        className=" inline-flex items-center gap-2 text-sm sm:text-base font-medium text-linen-light bg-green-balance p-2 rounded-md hover:text-sage hover:bg-green-balance-opaque transition-colors"
                    >
                        <span>{backLabel}</span>
                    </Link>
                </nav>
            )}

            {/* Title and actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-base sm:text-lg lg:text-xl font-light text-gray-600 mt-2 sm:mt-3">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}