import express from "express"
import router from "./routes/accountRoutes.js"

const server = express()

server.use(express.json())

//routing
server.use("/api/accounts", router)
server.use("/api/movements", router)


export default server