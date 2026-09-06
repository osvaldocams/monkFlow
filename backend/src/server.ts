import express from "express"
import accountRouter from "./routes/accountRoutes.js"
import movementRouter from "./routes/movementRoutes.js"
import TagsRouter from "./routes/tagRoutes.js"
import cors from "cors"
import { corsConfig } from "./config/cors.js"

const server = express()

server.use(cors(corsConfig)) //importamos y ejecutamos cors

server.use(express.json())

//routing
server.use("/api/accounts", accountRouter)
server.use("/api/movements", movementRouter)
server.use('/api/tags', TagsRouter)

export default server
