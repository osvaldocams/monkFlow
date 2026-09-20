import { useTags } from "@/hooks/useTags"
import { Tag, Plus } from "lucide-react"
import type { MovementFormInputs } from "@/types"
import { useFormContext } from "react-hook-form"

interface TagPickerProps {
    onCreateTag?: () => void
}

export default function TagPicker({ onCreateTag }: TagPickerProps) {

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
    if (!tags?.length) return <p className="text-sm text-clay-gray">No hay tags disponibles</p>


    return (
        <>
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer
                            ${isSelected
                                    ? 'border-transparent text-white'
                                    : 'border-green-balance text-obsidian hover:bg-sage-opaque'
                                }
                            `}
                            style={isSelected ? { backgroundColor: tag.color } : undefined}
                        >
                            <Tag className="w-3 h-3" />
                            {tag.name}
                        </button>
                    )
                })

                }
            </div>
            {onCreateTag && (
                <button type="button" onClick={onCreateTag} className="text-xs font-medium px-3 py-1.5 mt-2 border rounded-md cursor-pointer">
                    <Plus className="w-3 h-3" />
                    Crear Tag
                </button>
            )}
        </>

    )
}

