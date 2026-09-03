import { Router } from "express";
import { TagControllers } from "../controllers/tagControllers.js";
import { body, param } from "express-validator";
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

// UPDATE TAG 
router.patch('/:id',
    param("id").isUUID().withMessage("The tag ID must be a valid UUID"),
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Tag name cannot be empty'),
    body('color')
        .optional()
        .isHexColor().withMessage("color must be a valid hex color"),
    handleInputErrors,
    TagControllers.updateTag
)


export default router
