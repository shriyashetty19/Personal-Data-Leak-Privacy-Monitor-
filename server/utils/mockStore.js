import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '../data/store.json');

/**
 * MockStore - A high-speed, persistent file-based data store for the Personal Data Leak Monitor
 * This provides a reliable fallback if MongoDB is not available, using a local .json file.
 */
class MockStore {
    constructor() {
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(STORE_PATH)) {
                const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
                this.users = data.users || [];
                this.alerts = data.alerts || [];
                this.subscriptions = data.subscriptions || [];
                this.auditLogs = data.auditLogs || [];
                console.log('📦 MockStore: Loaded data from store.json');
            } else {
                this.users = [];
                this.alerts = [];
                this.subscriptions = [];
                this.auditLogs = [];
                this.saveData();
            }
        } catch (error) {
            console.error('❌ MockStore: Error loading data:', error);
            this.users = [];
            this.alerts = [];
            this.subscriptions = [];
            this.auditLogs = [];
        }
    }

    saveData() {
        try {
            const data = {
                users: this.users,
                alerts: this.alerts,
                subscriptions: this.subscriptions,
                auditLogs: this.auditLogs
            };
            fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ MockStore: Error saving data:', error);
        }
    }

    // --- User Operations ---
    
    async findUserByEmail(email) {
        return this.users.find(u => u.email === email);
    }

    async findUserById(id) {
        return this.users.find(u => u._id === id);
    }

    async createUser(userData) {
        const newUser = {
            _id: Math.random().toString(36).substr(2, 9),
            monitoredEmails: [],
            scanHistory: {},
            isVerified: false,
            verificationOTP: null,
            otpExpires: null,
            ...userData,
            createdAt: new Date(),
            save: async () => { 
                this.saveData();
                return this; 
            }
        };
        this.users.push(newUser);
        this.saveData();
        return newUser;
    }

    async findUserByOTP(otp) {
        return this.users.find(u => u.verificationOTP === otp);
    }

    async verifyUser(userId) {
        const user = await this.findUserById(userId);
        if (user) {
            user.isVerified = true;
            user.verificationOTP = null;
            user.otpExpires = null;
            this.saveData();
            return true;
        }
        return false;
    }

    async setOTP(userId, otp, expires) {
        const user = await this.findUserById(userId);
        if (user) {
            user.verificationOTP = otp;
            user.otpExpires = expires;
            this.saveData();
            return true;
        }
        return false;
    }

    async updateUserDetails(userId, updateData) {
        const userIndex = this.users.findIndex(u => u._id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updateData };
            this.saveData();
            return this.users[userIndex];
        }
        return null;
    }

    async updateScanTime(userId, email) {
        const user = await this.findUserById(userId);
        if (user) {
            if (!user.scanHistory) user.scanHistory = {};
            user.scanHistory[email] = new Date().toISOString();
            this.saveData();
        }
    }

    // --- Alert Operations ---

    async findAlertsByUser(userId) {
        return this.alerts.filter(a => a.user.toString() === userId.toString())
            .sort((a, b) => b.createdAt - new Date(a.createdAt));
    }

    async findAlertByEmailAndBreach(userId, email, breachName) {
        return this.alerts.find(a => 
            a.user.toString() === userId.toString() && 
            a.email === email && 
            a.breachName === breachName
        );
    }

    async createAlert(alertData) {
        const newAlert = {
            _id: Math.random().toString(36).substr(2, 9),
            isRead: false,
            ...alertData,
            createdAt: new Date(),
            // Mock Mongoose save method
            save: async () => { 
                this.saveData();
                return this; 
            }
        };
        this.alerts.push(newAlert);
        this.saveData();
        return newAlert;
    }

    // --- Subscription Operations ---
    async findSubscriptionByUser(userId) {
        if (!this.subscriptions) this.subscriptions = [];
        return this.subscriptions.find(s => s.user.toString() === userId.toString());
    }

    // --- Audit Log Operations ---
    async createAuditLog(logData) {
        if (!this.auditLogs) this.auditLogs = [];
        const newLog = {
            _id: Math.random().toString(36).substr(2, 9),
            ...logData,
            createdAt: new Date(),
        };
        this.auditLogs.push(newLog);
        this.saveData();
        return newLog;
    }
}

// Global instance to persist data while the server is running
const mockStore = new MockStore();

export default mockStore;
