import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { isDbConnected } from '../config/db.js';
import mockStore from '../utils/mockStore.js';
import { validateEmailExistence } from '../utils/emailValidator.js';
import { io } from '../server.js';
import Subscription from '../models/Subscription.js';
import { logAction } from '../utils/auditLogger.js';

// Mock breach database for demonstration

/**
 * Fetch real-time global breaches from XposedOrNot
 */
export const getGlobalThreats = async (req, res) => {
    try {
        const response = await fetch('https://api.xposedornot.com/v1/breaches');
        if (!response.ok) throw new Error('Failed to fetch global threats');
        const data = await response.json();
        
        // Transform real data for the UI
        const exposedBreaches = data.exposedBreaches || [];
        const threats = exposedBreaches.map(b => ({
            name: b.breachID,
            date: b.breachDate,
            riskLevel: b.exposureCount > 1000000 ? 'Critical' : b.exposureCount > 100000 ? 'High' : 'Medium',
            description: b.description,
            exposedCount: b.exposureCount,
            industry: b.industry || 'General',
            dataTypes: b.exposedData || ['Email addresses']
        }));

        res.status(200).json(threats.slice(0, 15)); // Top 15 recent
    } catch (error) {
        res.status(500).json({ message: 'Error fetching real-time threats' });
    }
};

/**
 * Initiate a deep dark web scan using IntelX/Flare concept (utilizing real breach analysis)
 */
export const initiateDarkWebScan = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Fetching real deep analysis data
        const apiRes = await fetch(`https://api.xposedornot.com/v1/breach-analysis?email=${encodeURIComponent(email)}`);
        const data = await apiRes.json();

        // Transform into "Forum Dump" style results for the UI
        const results = [];
        if (data.breachesDetails && Array.isArray(data.breachesDetails)) {
            data.breachesDetails.forEach((b, i) => {
                results.push({
                    id: i,
                    forum: b.breachID + ' Leak',
                    date: b.breachedDate,
                    threat: b.exposedRecords > 5000000 ? 'Critical' : 'High',
                    details: `Data Points: ${b.exposedData.join(', ')}`
                });
            });
        }

        res.status(200).json({
            status: 'completed',
            results: results.slice(0, 5),
            scanTimestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Dark Web Scan Error:', error);
        res.status(500).json({ message: 'Deep scan failed' });
    }
};

/**
 * Internal helper to scan an email and save alerts
 * This version is used by both the manual checker and the background monitor
 */
export const scanEmailInternal = async (email, userId) => {
    try {
        console.log(`📡 [Scan] Checking: ${email}`);
        
        const apiRes = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        let foundLeaks = [];
        if (apiRes.ok) {
            const data = await apiRes.json();
            if (data && data.breaches && Array.isArray(data.breaches)) {
                // Fetch full analysis for this email to get specific breach details
                const analysisRes = await fetch(`https://api.xposedornot.com/v1/breach-analysis?email=${encodeURIComponent(email)}`);
                const analysisData = await analysisRes.json();
                
                foundLeaks = data.breaches.map(breachName => {
                    const detail = analysisData.breachesDetails?.find(b => b.breachID === breachName) || {};
                    return {
                        name: breachName,
                        date: detail.breachedDate || new Date(),
                        compromisedData: detail.exposedData || ['Email addresses'],
                        description: detail.exposureDescription || `Your data was exposed in the ${breachName} breach.`,
                        riskLevel: detail.exposedRecords > 1000000 ? 'Critical' : 'High',
                        industry: detail.industry || 'General'
                    };
                });
            }
        } else if (apiRes.status === 404) {
            foundLeaks = [];
        }

        // Save new alerts to the database (MongoDB or MockStore)
        if (foundLeaks.length > 0) {
            let existingAlerts;
            if (isDbConnected) {
                existingAlerts = await Alert.find({ user: userId, email });
            } else {
                existingAlerts = await mockStore.findAlertsByUser(userId);
                existingAlerts = existingAlerts.filter(a => a.email === email);
            }
            
            const existingBreachNames = existingAlerts.map(a => a.breachName);

            for (const breach of foundLeaks) {
                if (!existingBreachNames.includes(breach.name)) {
                    const alertData = {
                        user: userId,
                        email: email,
                        breachName: breach.name,
                        date: breach.date,
                        compromisedData: breach.compromisedData,
                        description: breach.description,
                        riskLevel: breach.riskLevel || 'Medium'
                    };

                    if (isDbConnected) {
                        await Alert.create(alertData);
                    } else {
                        await mockStore.createAlert(alertData);
                    }
                }
            }
        }

        // Update scan history timestamp
        if (!isDbConnected) {
            await mockStore.updateScanTime(userId, email);
        } else {
            const user = await User.findById(userId);
            if (user) {
                if (!user.scanHistory) user.scanHistory = {};
                user.scanHistory[email] = new Date().toISOString();
                user.markModified('scanHistory');
                await user.save();
            }
        }

        // Emit real-time alert if leaks found
        if (foundLeaks.length > 0) {
            io.to(userId.toString()).emit('leak-detected', {
                email,
                leaks: foundLeaks
            });
        }

        return foundLeaks;
    } catch (error) {
        console.error(`❌ Scan Error for ${email}:`, error.message);
        return [];
    }
};

// @desc    Check email for data leaks (Real-Time API)
// @route   POST /api/monitor/check
// @access  Private
export const checkDataLeak = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required to check' });
        }

        // Realistic Validation
        const validation = await validateEmailExistence(email);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        const foundLeaks = await scanEmailInternal(email, req.user._id);

        res.status(200).json({
            email,
            leaksFound: foundLeaks.length,
            leaks: foundLeaks,
            status: foundLeaks.length > 0 ? 'Breached' : 'Safe'
        });

    } catch (error) {
        console.error('Check Route Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user dashboard data (monitored emails & alerts)
// @route   GET /api/monitor/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
    try {
        let user, alerts;
        if (isDbConnected) {
            user = await User.findById(req.user._id);
            alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
        } else {
            user = await mockStore.findUserById(req.user._id);
            alerts = await mockStore.findAlertsByUser(req.user._id);
        }
        
        // --- BACKGROUND AUTO-SCAN LOGIC ---
        // Trigger scans for emails that haven't been checked in 4 hours
        const COOLDOWN_MS = 4 * 60 * 60 * 1000;
        const now = new Date();
        const scanHistory = user.scanHistory || {};
        
        const emailsToScan = (user.monitoredEmails || []).filter(email => {
            const lastScanStr = scanHistory[email];
            if (!lastScanStr) return true;
            return (now - new Date(lastScanStr)) > COOLDOWN_MS;
        });

        if (emailsToScan.length > 0) {
            console.log(`🔄 Background Monitoring: Initiating scan for ${emailsToScan.length} assets...`);
            // Run scans in the background (no 'await' so dashboard loads instantly)
            emailsToScan.forEach(email => {
                scanEmailInternal(email, req.user._id).catch(err => 
                    console.error('Background Scan Failed:', err)
                );
            });
        }
        // ----------------------------------

        // Calculate Privacy Score
        let scoreReduction = 0;
        alerts.forEach(alert => {
            if (alert.riskLevel === 'High') scoreReduction += 20;
            else if (alert.riskLevel === 'Medium') scoreReduction += 10;
            else scoreReduction += 5;
        });

        let privacyScore = 100 - scoreReduction;
        if (privacyScore < 5) privacyScore = 5;

        // Count unread alerts
        const unreadCount = alerts.filter(a => !a.isRead).length;

        // Calculate Predicted Risk (Simulation)
        let predictedRisk = 'Low';
        if (alerts.length > 5 || alerts.some(a => a.riskLevel === 'High')) {
            predictedRisk = 'Elevated';
        }
        if (alerts.length > 10 || alerts.filter(a => a.riskLevel === 'High').length > 2) {
            predictedRisk = 'Critical';
        }

        // Gamification: Badges
        const badges = [];
        if (privacyScore >= 90) badges.push({ id: 'pro', name: 'Privacy Pro', color: 'bg-green-500/10 text-green-500' });
        if (privacyScore < 50) badges.push({ id: 'risk', name: 'At Risk', color: 'bg-red-500/10 text-red-500' });
        if ((user.monitoredEmails || []).length > 3) badges.push({ id: 'guardian', name: 'Digital Guardian', color: 'bg-blue-500/10 text-blue-500' });
        if (alerts.length === 0) badges.push({ id: 'clean', name: 'Untouchable', color: 'bg-purple-500/10 text-purple-500' });

        // Calculate Real Risk Vectors based on alerts
        const riskVectors = [
            { name: 'Credential Stuffing', risk: Math.min(100, alerts.length * 15), icon: 'Lock' },
            { name: 'Phishing Target', risk: Math.min(100, alerts.filter(a => a.riskLevel === 'High').length * 25), icon: 'Search' },
            { name: 'Domain Spoofing', risk: Math.min(100, user.monitoredEmails.length * 10), icon: 'Globe' },
            { name: 'API Exposure', risk: Math.min(100, alerts.filter(a => a.compromisedData?.includes('Passwords')).length * 30), icon: 'ShieldAlert' },
        ];

        // Dynamic Breach Locations for Map
        const industryMap = {
            'Technology': 'North America',
            'Finance': 'Europe',
            'Healthcare': 'North America',
            'Retail': 'Asia Pacific',
            'Gaming': 'Europe',
            'Government': 'Middle East',
            'Education': 'Europe',
            'Energy': 'Asia Pacific'
        };

        const breachLocations = alerts.map(a => ({
            name: a.breachName,
            region: industryMap[a.industry] || 'Global'
        }));

        res.status(200).json({
            monitoredEmails: user.monitoredEmails || [],
            scanHistory: user.scanHistory || {},
            totalAlerts: alerts.length,
            unreadAlerts: unreadCount,
            privacyScore,
            predictedRisk,
            badges,
            riskVectors,
            breachLocations,
            riskDensity: alerts.length > 20 ? 'CRITICAL' : alerts.length > 10 ? 'HIGH' : alerts.length > 5 ? 'ELEVATED' : 'STABLE',
            recentAlerts: alerts.slice(0, 5),
            recentActivity: [
                { id: 1, type: 'check', text: 'Identity Monitoring Active', time: 'LIVE' },
                { id: 2, type: 'identity', text: `${emailsToScan.length > 0 ? 'Updating records...' : 'Records up to date'}`, time: 'Now' },
                { id: 3, type: 'risk', text: `Risk Level: ${predictedRisk}`, time: 'Trend' }
            ]
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add an email to monitor
// @route   POST /api/monitor/add-email
// @access  Private
export const addMonitoredEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        // Realistic Validation
        const validation = await validateEmailExistence(email);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        let user, subscription;
        if (isDbConnected) {
            user = await User.findById(req.user._id);
            subscription = await Subscription.findOne({ user: req.user._id });
            
            const limits = { free: 1, pro: 10, enterprise: 1000 };
            const currentPlan = subscription?.planId || 'free';
            
            if (user.monitoredEmails.length >= limits[currentPlan]) {
                return res.status(403).json({ 
                    message: `Limit reached for ${currentPlan} plan. Upgrade to monitor more assets.`,
                    limit: limits[currentPlan]
                });
            }

            if (user.monitoredEmails.includes(email)) {
                return res.status(400).json({ message: 'Email already monitored' });
            }
            user.monitoredEmails.push(email);
            await user.save();
        } else {
            user = await mockStore.findUserById(req.user._id);
            if (user.monitoredEmails.includes(email)) {
                return res.status(400).json({ message: 'Email already monitored' });
            }
            user.monitoredEmails.push(email);
        }

        await logAction({
            userId: req.user._id,
            action: 'ADD_MONITOR',
            resource: 'IDENTITY',
            details: { email }
        }, req);

        res.status(200).json(user.monitoredEmails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove an email from monitoring
// @route   DELETE /api/monitor/remove-email
// @access  Private
export const removeMonitoredEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        let user;
        if (isDbConnected) {
            user = await User.findById(req.user._id);
            user.monitoredEmails = user.monitoredEmails.filter(e => e !== email);
            await user.save();
        } else {
            user = await mockStore.findUserById(req.user._id);
            user.monitoredEmails = user.monitoredEmails.filter(e => e !== email);
        }

        res.status(200).json(user.monitoredEmails);

        await logAction({
            userId: req.user._id,
            action: 'REMOVE_MONITOR',
            resource: 'IDENTITY',
            details: { email }
        }, req);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark alert as read
// @route   PUT /api/monitor/alert/:id/read
// @access  Private
export const markAlertRead = async (req, res) => {
    try {
        let alert;
        if (isDbConnected) {
            alert = await Alert.findById(req.params.id);
            if (!alert) return res.status(404).json({ message: 'Alert not found' });
            if (alert.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            alert.isRead = true;
            await alert.save();
        } else {
            // Mock read logic
            alert = await mockStore.findAlertsByUser(req.user._id);
            const alertToUpdate = alert.find(a => a._id.toString() === req.params.id);
            if (!alertToUpdate) return res.status(404).json({ message: 'Alert not found' });
            alertToUpdate.isRead = true;
            alert = alertToUpdate;
        }

        res.status(200).json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check HaveIBeenPwned via backend proxy
// @route   POST /api/monitor/hibp-check
// @access  Private
export const checkHIBP = async (req, res) => {
    try {
        const { email, apiKey } = req.body;
        if (!email || !apiKey) {
            return res.status(400).json({ message: 'Email and HIBP API Key are required' });
        }

        // Call HaveIBeenPwned API v3
        const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
            headers: {
                'hibp-api-key': apiKey,
                'User-Agent': 'PrivacyMonitorApp'
            }
        });

        if (response.status === 404) {
            // HIBP returns 404 if the account has no breaches
            return res.status(200).json({ breaches: [] });
        }

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ message: `HIBP API error: ${errText}` });
        }

        const data = await response.json();
        return res.status(200).json({ breaches: data });
    } catch (error) {
        console.error('❌ HIBP Proxy Error:', error);
        return res.status(500).json({ message: 'Error checking HIBP API: ' + error.message });
    }
};

// @desc    Get AI threat/risk forecast
// @route   POST /api/monitor/ai-forecast
// @access  Private
export const getAIForecast = async (req, res) => {
    try {
        const { breachCount, privacyScore, predictedRisk } = req.body;
        
        // If GEMINI_API_KEY is available, we use Gemini API to generate a personalized forecast
        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = `You are a cybersecurity expert AI. Based on the following user data breach monitoring statistics:
- Total historical breaches: ${breachCount}
- Privacy Integrity Score (0-100): ${privacyScore}
- Predicted Risk Level: ${predictedRisk}

Generate a JSON object representing an security threat forecast for the next 30 days.
The JSON object must strictly match this structure:
{
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "probability30Days": number (0 to 100 representing percentage likelihood of targeted cyber threat),
  "predictedThreat": "A detailed 1-2 sentence description of the most likely cyber threat (e.g. credential stuffing, phishing, spam lists) targeting their profile",
  "topRecommendation": "A detailed 1-2 sentence recommendation for the single most important action they should take right now"
}
Ensure you return ONLY the JSON string. Do not include markdown formatting like \`\`\`json or anything else.`;

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json' }
                    })
                });

                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json();
                    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        const parsed = JSON.parse(text.trim());
                        return res.status(200).json(parsed);
                    }
                }
            } catch (geminiError) {
                console.warn('⚠️ Gemini API failed, falling back to smart rule-based generator:', geminiError.message);
            }
        }

        // Smart rule-based generator fallback
        let prob = Math.max(5, Math.min(95, 100 - privacyScore + breachCount * 5));
        let riskLevel = prob > 60 ? 'HIGH' : prob > 30 ? 'MEDIUM' : 'LOW';
        
        let predictedThreat = '';
        let topRecommendation = '';
        
        if (riskLevel === 'HIGH') {
            const threats = [
                `High credential stuffing risk due to ${breachCount} historical breaches. Attackers often target leaked passwords across multiple services.`,
                `Active targeted phishing campaign risk identified. Exposed personal data is commonly used to craft convincing social engineering lures.`,
                `Potential identity theft vulnerability. The variety of exposed data points makes your identity susceptible to impersonation or account takeover.`
            ];
            const recommendations = [
                `Immediately enable multi-factor authentication (MFA) on all critical accounts, especially email, financial, and social services.`,
                `Perform a security audit of your main email accounts, rotate passwords, and check for unauthorized forwarding rules.`,
                `Utilize a premium password manager to generate and store unique, strong, 16+ character passwords for every single site.`
            ];
            predictedThreat = threats[breachCount % threats.length];
            topRecommendation = recommendations[breachCount % recommendations.length];
        } else if (riskLevel === 'MEDIUM') {
            const threats = [
                `Elevated risk of unsolicited spam and target advertising lists. Your email is compiled in several marketing and database leak lists.`,
                `Moderate risk of password spraying attacks. Common or reused passwords associated with this email could be tested on mainstream sites.`,
                `Low-to-moderate threat of credential leaks leading to profile correlation across public forums.`
            ];
            const recommendations = [
                `Change passwords for any account linked to the breached domains immediately, ensuring no password reuse.`,
                `Monitor your credit reports and financial statements for any unusual activity over the next 90 days.`,
                `Consider using email aliases (e.g. duck.com, icloud hide my email) for new subscriptions and newsletters.`
            ];
            predictedThreat = threats[breachCount % threats.length];
            topRecommendation = recommendations[breachCount % recommendations.length];
        } else {
            predictedThreat = `Secure profile. Low exposure rate reduces likelihood of targeted credential attacks or immediate threats in the next 30 days.`;
            topRecommendation = `Continue monitoring your status, enable notifications for new leaks, and maintain unique passwords across your services.`;
        }

        return res.status(200).json({
            riskLevel,
            probability30Days: Math.round(prob),
            predictedThreat,
            topRecommendation
        });

    } catch (error) {
        console.error('❌ AI Forecast Error:', error);
        res.status(500).json({ message: 'Error generating threat forecast: ' + error.message });
    }
};
