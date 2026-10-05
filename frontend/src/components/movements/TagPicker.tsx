import { useTags } from "@/hooks/useTags"
import { Tag, Plus } from "lucide-react"
import type { MovementFormInputs } from "@/types"
import { useFormContext } from "react-hook-form"

interface TagPickerProps {
    onCreateTag?: () => void
    disabled?: boolean
}

export default function TagPicker({ onCreateTag, disabled }: TagPickerProps) {

    const { watch, setValue } = useFormContext<MovementFormInputs>()
    const selectedTagIds = watch("tags") ?? []

    const { data: tags, isLoading } = useTags()

    const handleToggleTag = (tagId: string) => {
        const updated = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter(id => id !== tagId)
            : [...selectedTagIds, tagId]
        setValue("tags", updated, { shouldValidate: true })
    }

    if (isLoading) return <p className="text-sm text-clay-gray">cargando tags...</p>

    return (
        <div>
            {!tags?.length && (
                <p className="text-sm text-clay-gray mb-2">
                    No hay tags disponibles todavía
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                {tags?.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all 
                            ${isSelected
                                    ? 'border-transparent text-white'
                                    : 'border-green-balance text-obsidian hover:bg-sage-opaque'
                                }
                            ${disabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                            `}
                            disabled={disabled}
                            style={isSelected ? { backgroundColor: tag.color } : undefined}
                        >
                            <Tag className="w-3 h-3" />
                            {tag.name}
                        </button>
                    )
                })}
                {onCreateTag && (
                    <button
                        type="button"
                        onClick={onCreateTag}
                        disabled={disabled}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all
                        ${disabled
                                ? 'border-clay-gray text-clay-gray opacity-50 cursor-not-allowed'
                                : 'border-green-balance text-green-balance hover:bg-sage-opaque focus-visible:ring-2 focus-visible:ring-green-balance focus-visible:ring-offset-1 cursor-pointer'
                            }
                        `}
                    >
                        <Plus className="w-3 h-3" />
                        Crear Tag
                    </button>
                )}
            </div>
        </div>

    )
}

