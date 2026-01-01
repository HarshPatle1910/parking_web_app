import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All settings routes require authentication
router.use(authenticateToken);

router.get('/', (req, res) => settingsController.getSettings(req, res));
router.put('/', (req, res) => settingsController.updateSettings(req, res));

export default router;

