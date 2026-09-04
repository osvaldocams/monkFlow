
# 📓 Phase 15: TAGS BACKEND CRUD

**[2026-08-29] - Setup Inicial Módulo Tags**

1. se creó la rama de desarrollo feat/backend-tags-crud sin inconvenientes

2. se tenía planificado crear un archivo para nuestro model tags, lo cual era incorrecto ya que en prisma orm se debe integrar al archivo `schema.prisma`
    - se añadió la correspondiente relación many to many en el modelo movements
    - se añadió el bloque para el modelo Tags el cual contiene 
        id-String-uuid
        name-String
        slug-String-@unique (para evitar duplicidades)
        color-String-default("#6B7280") (con un default)
        timestamps
        relacion inversa con movements
    - guardar cambios
    - ejecutamos `npx prisma db push` y `npx prisma generate`

3. creamos el archivo donde se escribirán los controllers `src/controllers/tagControllers.ts` de los tag usaremos el formato de clase y metodos estáticos como se ha venido manejando en el proyecto, escribiremos un metodo de prueba que se llamara `getAllTags` y solo responde con un mensaje: res.json({message: "tags hello world"})

4. creamos el archivo donde escribiremos los endpoints `src/routes/tagRoutes.ts`, lo primero es instanciar nuestro Router de express y el enpoint llamando a nuestra clase y metodo controlador
```ts
const router = Router()


// GET ALL TAGS
router.get('/', TagControllers.getAllTags)
```
5. tenemos que registrar esta nueva ruta en el archivo `server.ts`, es necesario importar el archivo `tagRoutes` y generar la ruta
```ts

import TagsRouter from "./routes/tagRoutes.js"


server.use('/api/tags', TagsRouter)
```

6. para poder hacer la prueba se instaló el plugin kulala

7. vamos al archivo requests.http y generamos una prueba esperando se ejecute nuestro controlador mostrando el mensaje de prueba

***

**[2026-08-30] - POST Tags**

1. empezaremos creando `src/helpers/index.ts` basicamente crearemos la funcion que transforma el name en el slug y una segunda que revise que sea unico

2. ya que tenemos el helper ya podemos trabajar en el controlador, agregamos un nuevo método estático `createTag`
    - se extrae name y color del body
    - se genera el slug
    - se verifica unicidad
    - se crea en la db.

3. creamos el endpoint en `tagRoutes.ts` se crea el endpoint tipo POST, validamos los input pasamos el middleware que maneja los errores de input y finalmente el controlador

4. realizamos una prueba ejecutando desde el archivo http, revisamos que se generen los tags y que el comportamiento esté conforme a lo esperado, caso contrario revisamos de vuelta.

5. la prueba resultó exitosa.

***

**[2026-09-01] - GET Tags**

Implementación de Consulta en Controlador (TagControllers.ts):

1. Escribimos la lógica real dentro del método estático getAllTags. En lugar del mensaje mock previo, integramos prisma.tag.findMany ordenando los resultados de forma consistente. La respuesta se devuelve con un estado 200 OK dentro de un bloque try/catch estandarizado con registro de errores e informe de fallo en servidor (500 Internal Server Error).

2. Ajustes en Enrutador (tagRoutes.ts):
    Como la ruta GET / ya se había definido durante la comprobación inicial de la estructura MVC, únicamente se limpió el archivo agregando bloques de comentarios descriptivos para mantener la coherencia y legibilidad visual con el resto de módulos del proyecto.

3. Verificación y Depuración de Petición HTTP:
    Se ejecutó la prueba desde el cliente HTTP en Neovim. Durante el primer intento se observó que la respuesta seguía devolviendo el mensaje mock antiguo; la causa fue que el proceso del servidor backend se había pausado en segundo plano. Tras reiniciar el servidor de desarrollo, el endpoint devolvió exitosamente el arreglo de etiquetas registrado en PostgreSQL.


**[2026-09-02] - PATCH Tags**

1. para implementar la modificacion de los tags vamos a crear un metodo PATCH, lo primero es ir al archivo `tagControllers` y vamos a crear un interface que nos dé el tipo de  los inputs, posteriormente creamos un metodo `updateTag`
    - la interface UpdateTagInput, recibe name? y color? ambos string 
    - empezamos con el metodo updateTag primero necesitamos buscar el tag existente lo hacemos con el metodo `findUnique` y validamos que existe
    - preparamos los datos para su actualización `const data: { name?: string; slug?: string; color?: string } = {}`
    - para el caso de name validamos que no sea undefined para asignar name y crear el slug tambien verificamos la unicidad
    ```ts 
    // 2. Preparar datos de actualización
    const data: { name?: string; slug?: string; color?: string } = {}

    if (name !== undefined) {
        data.name = name
        data.slug = generateSlug(name)

        // Solo verificar unicidad si el slug cambió
        if (data.slug !== existingTag.slug) {
            if (!(await isSlugUnique(data.slug))) {
                return res.status(409).json({ error: "A tag with this name already exists" })
            }
        }
    }
    ```
    - hacemos lo propio con color acá solo validamos que no esté undefined y lo asignamos
    ```ts 
    if (color !== undefined) {
        data.color = color
    }
    ```
    - actualizamos el tag y mandamos la respuesta
    ```ts 
    // 3. Actualizar
    const updatedTag = await prisma.tag.update({
        where: { id },
        data
    })

    res.status(200).json(updatedTag)
    ```
    - hacemos el manejo de errores en el catch
    ```ts 
    catch (error) {
        console.error(error)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: "Tag not found" })
            }
        }
        res.status(500).json({ error: "Error updating tag" })
    }
    ```

2. vamos al archivo `tagRoutes` vamos a crear la ruta con sus respectivas validaciones express validator 
    - esta ruta patch para saber que tag es recibe un id 
    - realizamos validaciones tanto al param como al body, posteriormente solo añadimos el middleware para inputs y el controlador
    ```ts 
    // UPDATE TAG
    router.patch("/:id",
        param("id").isUUID().withMessage("The tag ID must be a valid UUID"),
        body("name")
            .optional()
            .trim()
            .notEmpty().withMessage("Tag name cannot be empty"),
        body("color")
            .optional()
            .isHexColor().withMessage("Color must be a valid hex color"),
        handleInputErrors,
        TagControllers.updateTag
    )
    ```
3. realizamos una prueba http
```
### PATCH update tag
PATCH http://localhost:3000/api/tags/69457f44f2dad07f0d0c3490
Content-Type: application/json

{
    "name": "tag updated"
}
```


**[2026-09-02] - GET Tags by id**

1. para obtener los tags por su id vamos a escribir un nuevo metodo estatico `getTagById` el proceso es: obtener el id, obtenemos el id de la base de datos, validamos que se haya obtenido correctamente, enviamos la respuesta con el status 200 y el json

2. creamos la ruta en el archivo `tagRoutes` solamente validamos el param uuid, si pasa la validación entra el middleware y depues el controlador.

3. finalmente hacemos una prueba, podemos hacer una peticion getAllTags, copiarnos un id, lo escribimos en nuestra url y probamos 

4. durante la prueba encontramos un `zombie proccess` revisamos varias veces que el código no tuviera alguna inconsistencia sin embargo no fue posible encontrar nada, tras una prueba donde comprobamos que nuestro controlador no llegaba a ejecutarse, se infirió que podía ser un tema con el server, así que detuvimos la ejecución y la volvimos a poner en marcha, lo cual fue la solución.
nos queda el siguiente aprendizaje: Cuando un endpoint responda con una página HTML de error de Express (Cannot GET /...), es la señal clara de que el servidor no reconoce la ruta y conviene hacer un reinicio limpio del proceso de desarrollo en la terminal.

1. Implementación de Búsqueda Individual (`TagControllers.ts`):
    Creamos el método estático `getTagById`. La función extrae el parámetro `id` de `req.params` y ejecuta la consulta mediante `prisma.tag.findUnique`. Se añade una validación explícita para verificar la existencia del registro: si la búsqueda devuelve null, responde un estado 404 Not Found con mensaje formativo; en caso de éxito, retorna la etiqueta con un estado 200 OK.

2. Registro de Ruta y Middleware (tagRoutes.ts):
    Registramos el endpoint GET /:id aplicando la regla de validación de express-validator sobre el parámetro de ruta (param('id').isUUID()). La petición pasa secuencialmente por el middleware handleInputErrors antes de delegar la ejecución al controlador getTagById.

3. Verificación de Endpoint E2E:
    Obtuvimos un UUID válido ejecutando previamente la petición GET /api/tags y realizamos la prueba de lectura individual desde el cliente HTTP en Neovim.

4. Depuración de "Zombie Process" y Aprendizaje Técnico:
    Durante las primeras pruebas la petición fue rechazada con un error HTML nativo de Express (Cannot GET /api/tags/<uuid>). Al comprobar mediante logs que la ejecución ni siquiera alcanzaba el controlador, se determinó que el proceso de desarrollo en memoria (tsx watch) se hallaba desincronizado y desfasado respecto al archivo de rutas actualizado. Tras detener la ejecución y reiniciar la terminal con pnpm dev, el mapa de rutas se re-compiló correctamente y la prueba fue exitosa.

    💡 Post-Mortem / Key Takeaway:
    Cuando un endpoint responda con una página HTML de error de Express (Cannot GET /...), es una señal clara de que el servidor en ejecución no reconoce la ruta en su tabla activa. Antes de reescribir código, conviene hacer un reinicio limpio del proceso de desarrollo en la terminal.


**[2026-09-04] - DELETE tag**

1. Lógica de Eliminación e Integridad Referencial (TagControllers.ts):
Implementamos el método estático deleteTag. Para garantizar que la eliminación no rompa el historial de transacciones, se configuró una estrategia de protección previa:
    - Se consulta la etiqueta mediante prisma.tag.findUnique incluyendo la relación con movimientos (include: { movements: true }).
    - Se evalúa la existencia de la etiqueta; de no encontrarse, responde un estado 404 Not Found.
    - Se añade una regla de negocio: si la etiqueta contiene movimientos vinculados (tag.movements.length > 0), se detiene la operación devolviendo un código 409 Conflict para informar al cliente que no es posible eliminar una etiqueta en uso.
    - Si supera las validaciones, se ejecuta prisma.tag.delete y se retorna una respuesta con estado 200 OK.

2. Definición de Ruta HTTP (tagRoutes.ts):
Registramos el endpoint DELETE /:id implementando la sanitización de parámetros con express-validator:
    - Parámetro id validado estrictamente como UUID.
    - Ejecución del middleware handleInputErrors antes de invocar la lógica del controlador.

3. Pruebas End-to-End:
Se realizaron las peticiones desde el cliente HTTP en Neovim comprobando la eliminación exitosa de etiquetas huérfanas, así como la activación de la respuesta 409 al intentar borrar etiquetas con transacciones asociadas.
