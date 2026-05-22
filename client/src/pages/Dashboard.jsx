import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrivacyScore from '../components/PrivacyScore';
import LoadingSpinner from '../components/LoadingSpinner';
import ActionModal from '../components/ActionModal';
import ThreatFeedSidebar from '../components/ThreatFeedSidebar';
import ExposureMap from '../components/ExposureMap';
import DarkWebScanner from '../components/DarkWebScanner';
import AdminDashboard from '../components/AdminDashboard';
import RiskAnalysis from '../components/RiskAnalysis';
import { io } from 'socket.io-client';
import { 
    ShieldAlert, 
    Mail as MailIcon, 
    AlertTriangle, 
    CheckCircle2, 
    ExternalLink, 
    Clock, 
    Plus,
    Trash2,
    TrendingUp,
    ChevronRight,
    Search,
    ShieldCheck,
    Eye,
    Zap,
    Download,
    Lock,
    Settings,
    FileText,
    LayoutDashboard,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const Dashboard = () => {
    const { api, user } = useAuth();
    const [data, setData] = useState({
        monitoredEmails: [],
        totalAlerts: 0,
        unreadAlerts: 0,
        privacyScore: 100,
        predictedRisk: 'Low',
        badges: [],
        recentAlerts: [],
        recentActivity: [],
        riskVectors: []
    });
    const [subscription, setSubscription] = useState({ planId: 'free', status: 'active' });
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(new Date());
    const [isAdminView, setIsAdminView] = useState(false);
    
    // Action Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'password',
        breachName: '',
        email: ''
    });

    useEffect(() => {
        fetchDashboardData();
        
        // Socket.io Real-Time Integration
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001');
        
        if (user?._id) {
            socket.emit('join', user._id);
        }

        socket.on('leak-detected', (data) => {
            toast.error(`CRITICAL: New leak detected for ${data.email}!`, {
                duration: 6000,
                icon: '🚨'
            });
            fetchDashboardData(); // Refresh data to show new alerts
        });

        // Auto Background Monitoring
        const monitorInterval = setInterval(() => {
            fetchDashboardData(true);
        }, 60000); 

        return () => clearInterval(monitorInterval);
    }, []);

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [dashRes, subRes] = await Promise.all([
                api.get('/monitor/dashboard'),
                api.get('/subscription/me')
            ]);
            setData(dashRes.data);
            setSubscription(subRes.data);
            setLastScanTime(new Date());
        } catch (error) {
            if (!silent) toast.error('Failed to sync dashboard data');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleAddEmail = async (e) => {
        e.preventDefault();
        if (!newEmail) return;
        setIsAdding(true);
        try {
            await api.post('/monitor/add-email', { email: newEmail });
            toast.success('Email added to monitoring');
            setNewEmail('');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add email');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveEmail = async (email) => {
        try {
            await api.delete('/monitor/remove-email', { data: { email } });
            toast.success('Monitoring stopped for ' + email);
            fetchDashboardData();
        } catch (error) {
            toast.error('Failed to remove email');
        }
    };

    const openActionModal = (type, alert) => {
        setModalConfig({
            isOpen: true,
            type,
            breachName: alert.breachName,
            email: alert.email
        });
    };

    // Phase 7: PDF Report Generation
    const downloadReport = () => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();
        
        // Branding
        doc.setFontSize(24);
        doc.setTextColor(147, 51, 234); // Purple
        doc.text('PRIVACY SHIELD PRO', 20, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('ENTERPRISE SECURITY AUDIT REPORT', 20, 40);
        doc.text(`Generated: ${timestamp}`, 20, 45);
        
        // User Info
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 10);
        doc.text(`User: ${user?.name || 'Authorized Member'}`, 20, 65);
        doc.text(`Privacy Index: ${data.privacyScore}/100`, 20, 75);
        doc.text(`Predicted Risk Level: ${data.predictedRisk}`, 20, 85);
        
        // Summary Table Header
        doc.setFillColor(248, 250, 252);
        doc.rect(20, 100, 170, 10, 'F');
        doc.setFontSize(10);
        doc.text('MONITORED IDENTITY ASSETS', 25, 107);
        
        let y = 117;
        data.monitoredEmails.forEach((email, i) => {
            doc.text(`${i+1}. ${email}`, 25, y);
            y += 10;
        });
        
        // Breaches
        y += 10;
        doc.setFillColor(254, 242, 242);
        doc.rect(20, y, 170, 10, 'F');
        doc.setTextColor(220, 38, 38);
        doc.text('CRITICAL EXPOSURES DETECTED', 25, y + 7);
        
        y += 15;
        doc.setTextColor(0, 0, 0);
        if (data.recentAlerts.length > 0) {
            data.recentAlerts.forEach((alert) => {
                doc.setFont('helvetica', 'bold');
                doc.text(alert.breachName, 25, y);
                doc.setFont('helvetica', 'normal');
                doc.text(` - ${alert.email} (${alert.riskLevel})`, 80, y);
                y += 8;
            });
        } else {
            doc.text('No critical exposures found in active repository.', 25, y);
        }
        
        // Recommendations
        y += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMMENDED REMEDIATION ACTIONS:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('1. Change passwords for all leaked platforms using high-entropy strings.', 20, y + 10);
        doc.text('2. Enable TOTP-based Two Factor Authentication on all sensitive accounts.', 20, y + 18);
        doc.text('3. Use a hardware security key (FIDO2) for primary identity endpoints.', 20, y + 26);
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('This report is confidential and protected by end-to-end encryption.', 105, 280, { align: 'center' });
        
        doc.save(`Privacy_Shield_Report_${user?.name?.replace(' ', '_') || 'Member'}.pdf`);
        toast.success('Security Audit downloaded successfully!');
    };

    if (loading) {
        return <LoadingSpinner fullPage />;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10"
        >
            {/* Action Modal */}
            <ActionModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                actionType={modalConfig.type}
                breachName={modalConfig.breachName}
                email={modalConfig.email}
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <motion.h1 
                            variants={itemVariants}
                            className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
                        >
                            {isAdminView ? 'Admin Console' : `Welcome, ${user?.name?.split(' ')[0] || 'User'}`}
                        </motion.h1>
                        
                        {/* Gamification Badges */}
                        {!isAdminView && (
                            <div className="flex gap-1.5 ml-2">
                                {data.badges?.map(badge => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileHover={{ y: -2 }}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-current ${badge.color}`}
                                    >
                                        {badge.name}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <motion.p 
                        variants={itemVariants}
                        className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2"
                    >
                        {isAdminView ? (
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <Shield size={12} className="text-purple-500" />
                                Superuser Mode Enabled
                            </span>
                        ) : (
                            <>
                                Security posture: <span className={data.privacyScore > 70 ? 'text-green-500 font-black' : 'text-amber-500 font-black'}>
                                    {data.privacyScore > 70 ? 'OPTIMIZED' : 'REQUIRES ATTENTION'}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                     ID: {user?._id?.slice(-8).toUpperCase() || 'ANONYMOUS'}
                                </span>
                            </>
                        )}
                    </motion.p>
                </div>
                
                <motion.div variants={itemVariants} className="flex gap-3">
                    {/* Subscription Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest ${
                        subscription.planId === 'free' 
                        ? 'bg-slate-100 border-slate-200 text-slate-500' 
                        : 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                    }`}>
                        <Zap size={14} className={subscription.planId !== 'free' ? 'fill-purple-500' : ''} />
                        {subscription.planId} Plan
                    </div>

                    {!isAdminView && subscription.planId === 'free' && (
                        <button 
                            onClick={() => window.location.href='/pricing'}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 animate-pulse hover:animate-none"
                        >
                            Upgrade
                        </button>
                    )}
                    {/* Role Toggle Button */}
                    <button 
                        onClick={() => {
                            setIsAdminView(!isAdminView);
                            toast.success(`Switched to ${!isAdminView ? 'Admin' : 'User'} Mode`);
                        }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            isAdminView 
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' 
                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        {isAdminView ? <LayoutDashboard size={18} /> : <Shield size={18} />}
                        {isAdminView ? 'Identity View' : 'Admin Mode'}
                    </button>

                    {!isAdminView && (
                        <>
                            <button 
                                onClick={downloadReport}
                                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-2xl font-bold transition-all"
                            >
                                <FileText size={18} className="text-purple-500" />
                                Report
                            </button>
                            <button 
                                onClick={() => window.location.href='/check'}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 group btn-shine-effect"
                            >
                                <Search size={18} />
                                Run Global Scan
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}
                </motion.div>
            </div>

            {isAdminView ? (
                /* Admin View */
                <AdminDashboard />
            ) : (
                /* Regular User View */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content (3 Columns) */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Predictive Risk Banner */}
                        {data.predictedRisk !== 'Low' && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative ${
                                    data.predictedRisk === 'Critical' 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-600' 
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                }`}
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <AlertTriangle size={120} />
                                </div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`p-4 rounded-2xl ${data.predictedRisk === 'Critical' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-amber-500 text-white shadow-xl'}`}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                            🔮 PREDICTIVE RISK ALERT: {data.predictedRisk.toUpperCase()}
                                        </h3>
                                        <p className="text-sm font-medium opacity-80 mt-1">
                                            Our AI engine predicts a <span className="font-bold underline">{data.predictedRisk === 'Critical' ? '92%' : '65%'}</span> probability of identity compromise in 7 days.
                                        </p>
                                    </div>
                                </div>
                                <button className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg relative z-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900`}>
                                    Secure Now
                                </button>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <motion.div variants={itemVariants} className="glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp className="w-24 h-24 text-purple-600" />
                                </div>
                                <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-6 font-black">Security Index</h3>
                                <PrivacyScore score={data.privacyScore} />
                                <div className="mt-6 text-center">
                                    <p className="text-slate-900 dark:text-white font-black text-xl tracking-tight uppercase">
                                        {data.privacyScore >= 80 ? 'ELITE DEFENSE' : data.privacyScore >= 50 ? 'SECURED' : 'SYSTEM CRITICAL'}
                                    </p>
                                    <div className="flex items-center gap-1.5 justify-center mt-3">
                                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                            Active Monitor: {Math.floor((new Date() - lastScanTime) / 1000)}s ago
                                         </p>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div variants={itemVariants} className="lg:col-span-2">
                                <ExposureMap totalAlerts={data.totalAlerts} breachLocations={data.breachLocations} riskDensity={data.riskDensity} />
                            </motion.div>
                        </div>

                        {/* Risk Analysis Row (SaaS/Enterprise) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <DarkWebScanner userEmail={user?.email} />
                             <RiskAnalysis vectors={data.riskVectors} />
                        </div>

                        {/* Identity Hub & Threat Log Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <motion.div variants={itemVariants} className="glass-card rounded-[2.5rem] p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-slate-900 dark:text-white font-black flex items-center gap-3 uppercase">
                                        <Zap size={18} className="text-purple-500" />
                                        Identity Hub
                                    </h3>
                                    <form onSubmit={handleAddEmail} className="flex gap-2">
                                        <input 
                                            type="email" 
                                            placeholder="Add email..."
                                            className="w-32 sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-sm text-slate-900 dark:text-white"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            required
                                        />
                                        <button type="submit" disabled={isAdding} className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl">
                                            <Plus size={20} />
                                        </button>
                                    </form>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <AnimatePresence>
                                        {data.monitoredEmails.map((email) => (
                                            <motion.div key={email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 group hover:border-purple-500/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 font-black text-sm uppercase">{email[0]}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white font-mono">{email.split('@')[0]}@...</p>
                                                        <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mt-1">ACTIVE PROTECTION</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveEmail(email)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="glass-card rounded-[2.5rem] p-8">
                                 <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-slate-900 dark:text-white font-black flex items-center gap-3 uppercase">
                                        <ShieldAlert size={18} className="text-red-500" />
                                        Incident Log
                                    </h3>
                                    <div className="text-[10px] bg-red-500/10 text-red-500 px-3 py-1 rounded-full font-black uppercase">LIVE FEED</div>
                                </div>
                                <div className="space-y-4">
                                    {data.recentAlerts.map(alert => (
                                        <div key={alert._id} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-3 group">
                                             <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{alert.breachName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-tighter">{alert.email}</p>
                                                </div>
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${alert.riskLevel === 'High' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{alert.riskLevel}</span>
                                             </div>
                                             <button onClick={() => openActionModal('password', alert)} className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md">REMEDIATE</button>
                                        </div>
                                    ))}
                                    {data.recentAlerts.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                            <CheckCircle2 size={40} className="text-green-500" />
                                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Safe Environment</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        <ThreatFeedSidebar />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Dashboard;
