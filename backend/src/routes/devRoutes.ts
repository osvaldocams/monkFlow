import { Router } from 'express'
import { requireDevelopment, requireResetConfirmation } from '../middleware/index.js'
import { DevControllers } from '../controllers/DevControllers.js'

const router = Router()

router.post('/reset', requireDevelopment, requireResetConfirmation, DevControllers.resetDatabase)

export default router
