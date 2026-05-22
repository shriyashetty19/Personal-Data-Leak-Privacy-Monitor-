import cron from 'node-cron';
import { isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import { checkDataLeak } from '../controllers/monitorController.js'; // I'll refactor a bit or make an internal scan function

export const initCronJobs = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('🔄 [CRON] Starting background data leak scan');
        if (!isDbConnected) return;

        try {
            const { scanEmailInternal } = await import('../controllers/monitorController.js');
            const users = await User.find({ 'monitoredEmails.0': { $exists: true } });
            
            for (const user of users) {
                for (const email of user.monitoredEmails) {
                    // Just scan it. The internal function takes care of alerts.
                    await scanEmailInternal(email, user._id);
                }
            }
            console.log('✅ [CRON] Background scan completed');
        } catch (error) {
            console.error('❌ [CRON] Error during background scan:', error);
        }
    });
};
