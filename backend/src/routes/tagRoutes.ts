import { Router } from "express";
import { TagControllers } from "../controllers/tagControllers.js";


const router = Router()


// GET ALL TAGS
router.get('/', TagControllers.getAllTags)

export default router
