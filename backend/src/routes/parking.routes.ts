import { Router } from 'express';
import { parkingController } from '../controllers/parking.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All parking routes require authentication
router.use(authenticateToken);

router.post('/entry', (req, res) => parkingController.recordEntry(req, res));
router.post('/exit', (req, res) => parkingController.recordExit(req, res));
router.post('/calculate-charge', (req, res) => parkingController.calculateCharge(req, res));
router.post('/send-receipt', (req, res) => parkingController.sendReceipt(req, res));
router.get('/dashboard', (req, res) => parkingController.getDashboardStats(req, res));
router.get('/search', (req, res) => parkingController.searchVehicles(req, res));

export default router;

