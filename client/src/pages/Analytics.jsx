import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, AlertTriangle, TrendingUp, Zap, RefreshCw, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const globalBreachData = [
    { name: 'Jan', breaches: 2400 },
    { name: 'Feb', breaches: 1398 },
    { name: 'Mar', breaches: 9800 },
    { name: 'Apr', breaches: 3908 },
    { name: 'May', breaches: 4800 },
    { name: 'Jun', breaches: 3800 },
    { name: 'Jul', breaches: 4300 },
];

export default function Analytics() {
    const { api } = useAuth();
    const [dashData, setDashData] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [loadingForecast, setLoadingForecast] = useState(false);
    const [personalRiskData, setPersonalRiskData] = useState([
        { name: 'Jan', risk: 4000 },
        { name: 'Feb', risk: 3000 },
        { name: 'Mar', risk: 2000 },
        { name: 'Apr', risk: 2800 },
    ]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/monitor/dashboard');
            setDashData(res.data);
            // Build personal risk variance from alerts over time (simplified)
            const score = res.data.privacyScore ?? 100;
            setPersonalRiskData([
                { name: 'Jan', risk: Math.min(4000, score * 40) },
                { name: 'Feb', risk: Math.min(3500, score * 35) },
                { name: 'Mar', risk: Math.min(3000, score * 30) },
                { name: 'Apr', risk: Math.min(2800 + res.data.totalAlerts * 50, 4000) },
            ]);
        } catch (e) {
            // silently fail — data will be null
        }
    };

    const runAIForecast = async () => {
        setLoadingForecast(true);
        const toastId = toast.loading('Running AI forecast...');
        try {
            const res = await api.post('/monitor/ai-forecast', {
                breachCount: dashData?.totalAlerts ?? 0,
                privacyScore: dashData?.privacyScore ?? 100,
                predictedRisk: dashData?.predictedRisk ?? 'Low',
            });
            setForecast(res.data);
            toast.dismiss(toastId);
            toast.success('AI forecast complete!');
        } catch (e) {
            toast.dismiss(toastId);
            // Fallback deterministic forecast
            const score = dashData?.privacyScore ?? 100;
            const prob = Math.max(5, Math.min(95, 100 - score + (dashData?.totalAlerts ?? 0) * 5));
            setForecast({
                riskLevel: prob > 60 ? 'HIGH' : prob > 30 ? 'MEDIUM' : 'LOW',
                probability30Days: prob,
                predictedThreat: 'Credential stuffing attacks are likely based on your breach history.',
                topRecommendation: 'Enable 2FA on all breached accounts and update passwords using a password manager.',
            });
            toast.success('Forecast generated (offline mode)');
        } finally {
            setLoadingForecast(false);
        }
    };

    const historicalBreaches = dashData?.totalAlerts ?? 5;
    const predictedRisk = dashData?.predictedRisk ?? 'Elevated';
    const score = dashData?.privacyScore ?? 78;

    const riskColor = predictedRisk === 'Critical' ? 'text-red-400'
        : predictedRisk === 'Elevated' ? 'text-amber-400'
        : 'text-green-400';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 mb-8 mt-20 flex items-center gap-3">
                <Activity className="text-cyan-400" />
                Advanced Analytics
            </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl flex items-center h-full"
                >
                    <div className="p-4 bg-purple-500/20 rounded-full mr-4 flex-shrink-0">
                        <TrendingUp className="text-purple-400" size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Predictive Risk Trend</p>
                        <p className={`text-2xl font-bold ${riskColor}`}>{predictedRisk}</p>
                        <p className="text-xs text-slate-500 mt-1">Based on {historicalBreaches} breach records</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl flex items-center h-full"
                >
                    <div className="p-4 bg-red-500/20 rounded-full mr-4 flex-shrink-0">
                        <AlertTriangle className="text-red-400" size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Historical Breaches</p>
                        <p className="text-2xl font-bold text-white">{historicalBreaches}</p>
                        <p className="text-xs text-slate-500 mt-1">Privacy score: {score}/100</p>
                    </div>
                </motion.div>

                {/* AI Forecast Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                            <Brain size={16} className="text-purple-400" />
                            Automated Forecast
                        </p>
                        <button
                            onClick={runAIForecast}
                            disabled={loadingForecast}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all disabled:opacity-50"
                            title="Refresh AI forecast"
                        >
                            <RefreshCw size={14} className={loadingForecast ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {forecast ? (
                        <div className="space-y-2">
                            <p className="text-sm text-slate-300">
                                There is a{' '}
                                <span className={`font-bold ${forecast.probability30Days > 60 ? 'text-red-400' : forecast.probability30Days > 30 ? 'text-amber-400' : 'text-green-400'}`}>
                                    {forecast.probability30Days}%
                                </span>{' '}
                                probability of a new data leak affecting your accounts in the next 30 days.
                            </p>
                            <p className="text-xs text-purple-300 italic border-l-2 border-purple-500/40 pl-2">
                                💡 {forecast.topRecommendation}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-slate-300 mb-3">
                                Based on recent global activity, your risk of a new data leak in the next 30 days is{' '}
                                <span className="text-red-400 font-bold">
                                    {Math.max(5, Math.min(95, 100 - score + historicalBreaches * 3))}%
                                </span>.
                            </p>
                            <button
                                onClick={runAIForecast}
                                disabled={loadingForecast}
                                className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors font-bold"
                            >
                                <Zap size={12} />
                                Run AI Deep Analysis
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <h2 className="text-xl font-semibold mb-6 text-white">Global Breach Frequency</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={globalBreachData}>
                                <defs>
                                    <linearGradient id="colorBreaches" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Area type="monotone" dataKey="breaches" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBreaches)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <h2 className="text-xl font-semibold mb-6 text-white">Personal Risk Variance</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={personalRiskData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={[0, 4000]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="risk"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#a855f7', strokeWidth: 2, stroke: '#1e1b4b' }}
                                    activeDot={{ r: 8, fill: '#a855f7' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
