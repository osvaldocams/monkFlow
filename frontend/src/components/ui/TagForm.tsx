import { createTagSchema, type CreateTagFormInputs } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import type { SubmitEvent } from "react"


const PRESET_COLORS = [
    "#a3c9a8", "#b2b8b8", "#d00000", "#6a994e", "#e9edc9", "#f7f7f7"
]

interface TagFormProps {
    onSubmit: (data: CreateTagFormInputs) => void
    onCancel: () => void
    isPending: boolean
}

export default function TagForm({ onSubmit, onCancel, isPending }: TagFormProps) {

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(createTagSchema),
        defaultValues: { name: "", color: "#6B7280" }
    })

    const selectedColor = watch("color")

    const handleFormSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.stopPropagation()
        handleSubmit(onSubmit)(e)
    }


    return (
        <form onSubmit={handleFormSubmit} noValidate className="space-y-5">

            {/* name */}
            <div>
                <label className="block text-xs font-medium text-obsidian mb-1.5">
                    Nombre de la etiqueta
                </label>
                <input
                    type="text"
                    placeholder="Ej. Comida, Transporte, Freelance"
                    {...register("name")}
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg outline-none transition-all placeholder:text-clay-gray/60 ${errors.name ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-linen-light focus:border-green-balance focus:ring-1 focus:ring-green-balance"}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* color */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">
                    Color identificador
                </label>
                <div>
                    {PRESET_COLORS.map((hex) => (
                        <button
                            key={hex}
                            type="button"
                            onClick={() => setValue("color", hex, { shouldValidate: true, shouldDirty: true })}
                            className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-gray-950 ml-1 ${selectedColor === hex
                                ? "scale-110 ring-2 ring-offset-2 ring-obsidian"
                                : "hover:scale-105 opacity-80 hover:opacity-100"
                                }`}
                            style={{ backgroundColor: hex }}
                        />
                    ))}
                </div>
                {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
            </div>

            {/* acciones */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-linen-light">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isPending}
                    className="px-4 py-2 text-xs font-medium text-obsidian bg-linen-light/50 hover:bg-linen-light rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-balance hover:bg-green-balance/90 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isPending ? "Guardando..." : "Crear Etiqueta"}</span>
                </button>
            </div>
        </form>
    )
}

