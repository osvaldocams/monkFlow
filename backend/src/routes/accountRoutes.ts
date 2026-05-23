import { Router } from "express"
import { body } from "express-validator"
import { AccountControllers } from "../controllers/AccountControllers.js"
import { handleInputErrors } from "../middleware/index.js"

const router = Router()

//POST ACCOUNT
router.post("/", 
    body('name')
        .notEmpty()
        .withMessage('account name is required')
        .isString()
        .withMessage('account name must be a string'),
    body('kind')
        .notEmpty()
        .withMessage('account kind is required')
        .isIn(['CASH', 'BANK'])
        .withMessage('account kind must be one of the following values: CASH, BANK'),
    body('balance')
        .optional()
        .isNumeric()
        .withMessage('account balance must be a number')
        .custom((value) => value >= 0)
        .withMessage('account balance must be a non-negative number'),
    handleInputErrors,
    AccountControllers.createAccount
)

export default router