import { Router } from 'express';
import * as analyticsController from './analytics.controller.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/overview', analyticsController.getKPIs);
router.get('/tickets-today', analyticsController.getHourlyBreakdown);
router.get('/wait-times', analyticsController.getWaitTrends);
router.get('/counter-perf', analyticsController.getCounterPerf);
router.get('/service-distribution', analyticsController.getServiceDist);

export default router;
