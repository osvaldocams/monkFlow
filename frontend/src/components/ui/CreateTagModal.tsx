
import { X } from "lucide-react"

interface CreateTagModalProps {
    onClose: () => void
}

export default function CreateTagModal({ onClose }: CreateTagModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-obsidian/50"
                onClick={onClose}
            />

            {/* Contenido del modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-obsidian">
                        Crear Tag
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-clay-gray hover:text-obsidian transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario irá aquí en el futuro */}
                <div className="text-sm text-clay-gray">
                    Formulario de creación de tag (próximamente)
                </div>
            </div>
        </div>
    )
}

