
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
