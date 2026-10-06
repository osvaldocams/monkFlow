
# 📓 Phase 21: Movements detail and tags

---
**[2026-10-05] **

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
