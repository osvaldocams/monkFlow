import { Router } from "express"
import { AccountControllers } from "../controllers/AccountControllers.js"

const router = Router()

//routing
router.get("/", AccountControllers.testConnection)

export default router