import { Router } from "express"
import { body } from "express-validator"
import { handleInputErrors, normalizeAmount, validateMovementLogic } from "../middleware/index.js"
import { MovementController } from "../controllers/MovementControllers.js"

const router = Router()

//POST MOVEMENT
router.post("/", 
    body('type')
        .notEmpty()
        .bail()
        .isIn(['INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'])
        .withMessage(`Type must be one of: ${['INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'].join(', ')}`),
    body('amount')
        .notEmpty()
        .bail()
        .isNumeric()
        .withMessage('Amount must be a number')
        .toFloat(),
    body('description')
        .notEmpty()
        .bail()
        .isString()
        .trim(),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
        .toDate(),
    body('incomeAccountId')
        .optional()
        .isUUID()
        .withMessage("The account ID must be a valid UUID"),
    body('expenseAccountId')
        .optional()
        .isUUID()
        .withMessage("The account ID must be a valid UUID"),
    handleInputErrors,
    validateMovementLogic,
    normalizeAmount,
    MovementController.createMovement
)
export default router