import { Router } from 'express'
import { requireDevelopment } from '../middleware/index.js'
import { DevControllers } from '../controllers/DevControllers.js'

const router = Router()

router.post('/reset', requireDevelopment, DevControllers.resetDatabase)

export default router
