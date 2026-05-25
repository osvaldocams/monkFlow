import express from "express"
import accountRouter from "./routes/accountRoutes.js"
import movementRouter from "./routes/movementRoutes.js"

const server = express()

server.use(express.json())

//routing
server.use("/api/accounts", accountRouter)
server.use("/api/movements", movementRouter)

export default server