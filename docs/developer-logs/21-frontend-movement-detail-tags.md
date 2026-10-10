
# 📓 Phase 21: Movements detail and tags

---
**[2026-10-05] backend response**

<details>

1. vamos al archivo MovementControllers.ts en el metodo addTagToMovement necesitamos añadir a la respuesta status 200 el tag a modo que la información se muestre en la respuesta, no necesitamos tenerla en include, hacemos lo mismo para removeTagFromMovement en este caso tagId
    ```ts 
    // 285
    res.status(200).json({ message: `Tag '${tag.name}' added to movement`, tag })

    // 317
    res.status(200).json({ message: `Tag '${tag.name}' removed from movement`, tagId })
    ```
</details>

--- 

**[2026-10-07] API services**

<details>

1. vamos al alrchivo MovementAPI.ts para crear un par de nuevos metodos el primero de ellos `addTagToMovement`
    ```ts 
    addTagToMovement: async (movementId: Movement['id'], tagId: Tag['id']): Promise<Tag> => {
        try{
            const {data} = await api.post(`/movements/${movementId}/tags`, {tagId})
            const result = tagSchema.safeParse(data.tag)
            if(!result.success) throw new Error('invalid tag response format')
            return result.data
        } catch (error){
            handleApiError(error, 'Error adding tag to movement', {movementId, tagId})
        }
    }
    ```
2. hacemos lo propio con el metodo `removeTagFromMovement` a diferencia del anterior en este caso no necesitamos parsear 
    ```ts 
    removeTagFromMovement: async (movementId: Movement['id'], tagId: Tag['id']): Promise<void> => {
    try {
        await api.delete(`/movements/${movementId}/tags/${tagId}`)
    } catch (error) {
        handleApiError(error, 'Error removing tag from movement', { movementId, tagId })
    }
}
    ```

</details>

--- 

**[2026-10-07] hook useMovement**

<details>

1. lo primero que haremos será hacer un pequeño ajuste a los hook `useMovements` y `useMovementById` en los queryKey añadiremos al primero 'list' y al individual 'detail' de esta forma los identificamos de forma individual y evitamos interferencias en guardado y carga de caché lo manejaremos de forma manual con setQueryData
    ```ts 
    queryKey: ['movements', 'list']
    queryKey: ['movements', 'detail', movementId]

    ```
2. vamos a crear 2 nuevos hooks el primero `useAddTagToMovement`
    ```ts 
    interface MovementTagVars { movementId: Movement['id']; tagId: Tag['id'] }

    export const useAddTagToMovement = () => {
        const queryClient = useQueryClient()
        return useMutation({
            mutationFn: ({ movementId, tagId }: MovementTagVars) =>
                MovementAPI.addTagToMovement(movementId, tagId),
            onSuccess: (tag, { movementId }) => {
                queryClient.setQueryData<Movement>(["movements", "detail", movementId], (old) =>
                    old ? { ...old, tags: [...old.tags, tag] } : old
                )
                queryClient.invalidateQueries({ queryKey: ["movements", "list"] })
                toast.success("Etiqueta añadida al movimiento")
            },
            onError: (error) => toast.error(error.message)
        })
    }
    ```
3. el segundo hook `useRemoveTagFromMovement`
    ```ts 
    export const useRemoveTagFromMovement = () => {
        const queryClient = useQueryClient()
        return useMutation({
            mutationFn: ({ movementId, tagId }: MovementTagVars) =>
                MovementAPI.removeTagFromMovement(movementId, tagId),
            onSuccess: (_data, { movementId, tagId }) => {
                queryClient.setQueryData<Movement>(["movements", "detail", movementId], (old) =>
                    old ? { ...old, tags: old.tags.filter(t => t.id !== tagId) } : old
                )
                queryClient.invalidateQueries({ queryKey: ["movements", "list"] })
                toast.success("Etiqueta eliminada del movimiento")
            },
            onError: (error) => toast.error(error.message)
        })
    }
    ```

</details>

--- 


**[2026-10-10] compartir CreateTagModal**

<details>

1. hasta el momento el modal se cierra y no se sabe que salió de ahí, la props es una notificación al padre "este tag acaba de ser creado", y el padre decide que hacer con él.
    explicando en detalle: 
    `onCreateTag` (el que ya existe en MovementForm) funciona al revés: le dice al modal que abra. 
    El nuevo `onCreated` habla en la dirección opuesta, del modal hacia afuera.
    lo pondremos opcional ? para que MovementForm que no lo pasa lo siga compilando
2. añadimos al interface props onCreated 
    ```ts 
    interface CreateTagModalProps {
    onClose: () => void
    onCreated?: (tag: Tag) => void //importar type Tag 
    }
    ```
3. lo desestructuramos en el componente
    ```tsx 
    export default function CreateTagModal({ onClose, onCreated }: CreateTagModalProps) {
    ```
4. en la funcion handleSubmit creamos una variable para que se ejecute en el callback y no directamente
    ```ts 
    const handleSubmit = async (data: CreateTagFormInputs) => {
        try     {
            const cleanData = createTagSchema.parse(data)
            const newTag = await createTag(cleanData)   // ← antes era: await createTag(cleanData)
            onCreated?.(newTag)                          // ← antes no existía
            onClose()
        } catch (error) {
            console.error(error)
        }
    }
    ```
    await createTag(...) ahora se asigna a newTag porque mutateAsync devuelve la respuesta. Saber que fue lo que se guardó es lo que hace posible la notificación.
    onCreated?.(newTag) = "si existe la prop, llámala". Sin el ? revienta cuando la prop es undefined.

</details>

--- 
