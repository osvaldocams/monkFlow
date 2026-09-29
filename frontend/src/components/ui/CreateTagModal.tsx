
import { useCreateTag } from "@/hooks/useTags"
import { X } from "lucide-react"
import { createTagSchema, type CreateTagFormInputs } from "@/types"
import TagForm from "./TagForm"

interface CreateTagModalProps {
    onClose: () => void
}

export default function CreateTagModal({ onClose }: CreateTagModalProps) {

    const { mutateAsync: createTag, isPending } = useCreateTag()

    const handleSubmit = async (data: CreateTagFormInputs) => {
        try {
            const cleanData = createTagSchema.parse(data)
            await createTag(cleanData)
            onClose()
        } catch {
            console.error(Error)
        }
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/60 backdrop-blur-xs">
            {/* Overlay */}
            <div
                className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-2xl border border-linen-light"
                onClick={(e) => e.stopPropagation()}
            >
                {/* header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-linen-light">
                    <h3 className="text-base font-semibold text-obsidian">Crear nueva etiqueta</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="p-1 text-clay-gray hover:text-obsidian rounded-lg hover:bg-linen-light transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* formulario */}
                <TagForm
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isPending={isPending}
                />
            </div>
        </div>
    )
}

