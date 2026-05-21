#### 📝 Guias y comandos

**new branch**
```bash
git switch -c feature/mi-nueva-feature
```

**first commit in a new branch**
```bash
git add .
git commit -m "commit message"
git push -u origin HEAD
```
**Merge con github pull request**

1. Terminas la feature en tu rama y preparas
    - estas en feature/nombre-de-la-feature
    - Haces tus commits.
    - Haces git push origin feature/nombre.

2. Creas la Pull Request (PR) desde github:
    - entras al repositorio
    - GitHub automáticamente detectará que tu rama tiene cambios y mostrará un botón “Compare & pull request”.
    - base: main
    - compare: feature/nombre
    - Añades título y descripción (qué se hizo).en esta etapa no se hace merge todavía

3. Revisar la PR
    - si trabajas solo (es el caso) revisar uno mismo 
    - comprueba que n haya conflictos
    - Verificas que lo que se va a integrar está bien
    - Si hubiera conflictos: GitHub te lo indicará puedes resolverlos ahí o localmente.

4. Hacer el Merge (desde la PR)
    - Cuando ya está revisada, aprobarás la PR y presionas: 🔘 "Merge pull request"
    - Después de mergear, GitHub suele sugerir borrar la rama, se hace tambien

5. actualización en local
    - Basicamente iremos a la rama main y nos traeremos lo que está en github
    ```bash
    git checkout main
    git pull origin main
    ``` 
    - finalmente borramos la rama
    ```bash
    git branch -d feature/nombre
    ```