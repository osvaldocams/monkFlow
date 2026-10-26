import { Router } from "express";
import { DashboardControllers } from "../controllers/dashboardControllers.js";

const router = Router()

//GET ENDPOINT /api/dashboard/summary?interval=month
router.get('/summary', DashboardControllers.getDashboardSummary)


export default router
