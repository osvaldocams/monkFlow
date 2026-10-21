import { useState } from "react"
import type { Movement, Tag as TagType } from "@/types"
import { useTags } from "@/hooks/useTags"
import { useAddTagToMovement, useRemoveTagFromMovement } from "@/hooks/useMovements"
import { Tag, Plus, X, Loader2 } from "lucide-react"
import CreateTagModal from "../ui/CreateTagModal"


interface MovementTagsSectionProps {
    movementId: Movement['id']
    tags: TagType[]
}

export default function MovementTagsSection({ movementId, tags }: MovementTagsSectionProps) {
    //states 
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [isCreateTagOpen, setIsCreateTagOpen] = useState(false)
    const [pendingTagId, setPendingTagId] = useState<string | null>(null)

    //data fetching 
    const { data: allTags, isLoading } = useTags()
    const { mutate: addTag, isPending: isAdding } = useAddTagToMovement()
    const { mutate: removeTag, isPending: isRemoving } = useRemoveTagFromMovement()

    //calculo derivado 
    const assignedIds = new Set(tags.map(t => t.id))
    const unassigned = (allTags ?? []).filter(t => !assignedIds.has(t.id))

    //handlers 
    const handleTogglePanel = () => setIsPanelOpen(prev => !prev)

    const handleAttach = (tagId: string) => {
        setPendingTagId(tagId)
        addTag({ movementId, tagId }, {
            onSettled: () => setPendingTagId(null)
        })
    }

    const handleDetach = (tagId: string) => {
        setPendingTagId(tagId)
        removeTag({ movementId, tagId }, {
            onSettled: () => setPendingTagId(null)
        })
    }

    const handleTagCreated = (newTag: TagType) => {
        setPendingTagId(newTag.id)
        addTag({ movementId, tagId: newTag.id }, {
            onSettled: () => setPendingTagId(null)
        })
    }

    return (
        <div>
            {/* header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-obsidian">
                    <Tag className="w-5 h-5" />
                    <span className="font-semibold text-base">Etiquetas</span>
                </div>
                <button
                    type="button"
                    onClick={handleTogglePanel}
                    className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer 
                        ${isPanelOpen
                            ? 'bg-sage-opaque text-obsidian'
                            : 'text-green-balance hover:bg-sage-opaque'
                        }`
                    }
                >
                    {isPanelOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    {isPanelOpen ? 'Cerrar' : 'Añadir'}
                </button>
            </div>

            {/* tags asignados */}
            <div className="flex flex-wrap gap-2">
                {tags.length === 0 && (
                    <p className="text-sm text-clay-gray">
                        Este movimiento no tiene etiquetas
                    </p>
                )}
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleDetach(tag.id)}
                        disabled={isRemoving && pendingTagId === tag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all cursor-pointer hover:opacity-80 disabled:opacity-50"
                        style={{ backgroundColor: tag.color }}
                    >
                        <Tag className="w-3 h-3" />
                        {tag.name}
                        {isRemoving && pendingTagId === tag.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <X className="w-3 h-3" />
                        }
                    </button>
                ))}
            </div>

            {/* panel & modal */}
            {isPanelOpen && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-linen-light">
                    <p className="text-xs font-semibold text-clay-gray uppercase tracking-wide mb-2">
                        Tags disponibles
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {isLoading && (
                            <p className="text-sm text-clay-gray">Cargando tags...</p>
                        )}
                        {!isLoading && unassigned.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleAttach(tag.id)}
                                disabled={isAdding}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-green-balance text-obsidian hover:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAdding && pendingTagId === tag.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Tag className="w-3 h-3" />
                                }
                                {tag.name}
                            </button>
                        ))}
                        {!isLoading && unassigned.length === 0 && (
                            <p className="text-sm text-clay-gray">
                                {(allTags?.length ?? 0)
                                    ? "No hay etiquetas creadas todavía"
                                    : "Todas las etiquetas disponibles ya están aplicadas"
                                }
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsCreateTagOpen(true)}
                            disabled={isAdding}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-green-balance text-green-balance hover:bg-white transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Plus className="w-3 h-3" />
                            Crear Tag
                        </button>
                    </div>
                </div>
            )}
            {isCreateTagOpen && (
                <CreateTagModal
                    onClose={() => setIsCreateTagOpen(false)}
                    onCreated={handleTagCreated}
                />
            )}
        </div>
    )
}
