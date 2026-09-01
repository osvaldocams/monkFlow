
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


