import { Router } from "express";
import { TagControllers } from "../controllers/tagControllers.js";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/index.js";


const router = Router()


// GET ALL TAGS
router.get('/', TagControllers.getAllTags)


// CREATE TAG
router.post('/',
    body("name").trim().notEmpty().withMessage("Tag name is required"),
    body("color").optional().isHexColor().withMessage("Color must be a valid hex color"),
    handleInputErrors,
    TagControllers.createTag
)
export default router
