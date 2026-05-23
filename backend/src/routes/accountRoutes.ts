import { Router } from "express"
import { body, param } from "express-validator"
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

// GET ALL ACCOUNTS
router.get("/", AccountControllers.getAllAccounts)

// GET ACCOUNT BY ID
router.get("/:id",
    param("id")
        .isUUID().withMessage("the account ID must be a valid UUID"),
    handleInputErrors,
    AccountControllers.getAccountById
)

// UPDATE ACCOUNT
router.patch("/:id",
    param("id")
        .isUUID().withMessage("The account ID must be a valid UUID"),
    body('name')
        .notEmpty().withMessage('Account name is required')
        .isString().withMessage('Account name must be a string'),
    handleInputErrors,
    AccountControllers.updateAccount
)

// DELETE ACCOUNT
router.delete("/:id",
        param("id").isUUID().withMessage("The account ID must be a valid UUID"),
        handleInputErrors,
        AccountControllers.deleteAccount
)

export default router