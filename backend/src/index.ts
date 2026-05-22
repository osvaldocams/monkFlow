import server from "./server.js"
import { connectDB } from "./config/db.js"
import colors from 'colors'

const PORT = process.env.PORT || 3000

async function startServer() {
    //asegurar el canal de datos antes de iniciar el servidor
    await connectDB()

    //si la conexión es exitosa, iniciamos el servidor
    server.listen(PORT, () => {
        console.log(colors.green.bold(`Server is running on port ${PORT}`))
    })
}

startServer()