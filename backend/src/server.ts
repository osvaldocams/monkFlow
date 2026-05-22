import express from "express"
import router from "./routes/accountRoutes.js"

const server = express()

server.use(express.json())

//routing
server.use("/api/accounts", router)


export default server