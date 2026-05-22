import express from 'express';
import { 
    checkDataLeak, 
    getDashboardData, 
    addMonitoredEmail, 
    removeMonitoredEmail, 
    markAlertRead, 
    getGlobalThreats, 
    initiateDarkWebScan,
    checkHIBP,
    getAIForecast
} from '../controllers/monitorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes below require authentication

router.get('/dashboard', getDashboardData);
router.get('/global-threats', getGlobalThreats);
router.post('/darkweb-scan', initiateDarkWebScan);
router.post('/check', checkDataLeak);
router.post('/add-email', addMonitoredEmail);
router.delete('/remove-email', removeMonitoredEmail);
router.put('/alert/:id/read', markAlertRead);
router.post('/hibp-check', checkHIBP);
router.post('/ai-forecast', getAIForecast);

export default router;
