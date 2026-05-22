import AuditLog from '../models/AuditLog.js';
import { isDbConnected } from '../config/db.js';
import mockStore from './mockStore.js';

/**
 * Log an action to the Audit Log
 * @param {Object} params - Logging parameters
 * @param {String} params.userId - User ID performing the action
 * @param {String} params.orgId - Organization ID involved (optional)
 * @param {String} params.action - Action name (e.g. 'LOGIN', 'EMAIL_ADD')
 * @param {String} params.resource - Resource affected (e.g. 'USER', 'EMAIL_MONITOR')
 * @param {Object} params.details - Additional data
 * @param {Object} req - Express request object for IP/User-Agent
 */
export const logAction = async ({ userId, orgId, action, resource, details }, req = null) => {
    try {
        const logData = {
            user: userId,
            organization: orgId,
            action,
            resource,
            details,
        };

        if (req) {
            logData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            logData.userAgent = req.headers['user-agent'];
        }

        if (isDbConnected) {
            await AuditLog.create(logData);
        } else {
            await mockStore.createAuditLog(logData);
        }
    } catch (error) {
        console.error('❌ [AuditLog] Error logging action:', error.message);
    }
};
