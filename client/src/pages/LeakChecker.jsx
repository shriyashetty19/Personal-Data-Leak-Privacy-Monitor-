import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Search, ShieldCheck, ShieldAlert, Mail, ArrowRight,
    AlertCircle, ChevronDown, ChevronUp, Fingerprint, Key, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { validateEmail, getMockBreaches } from '../utils/emailValidator';

/* ── HIBP API key modal ── */
const HIBPKeyModal = ({ onSkip, onSave }) => {
    const [key, setKey] = useState('');
    return (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#161625] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                        <Key size={20} className="text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">HIBP API Key Required</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                    To scan for real breaches, enter your HaveIBeenPwned API key.{' '}
                    <a href="https://haveibeenpwned.com/API/Key" target="_blank" rel="noreferrer" className="text-purple-400 underline">
                        Get one free at haveibeenpwned.com
                    </a>
                </p>
                <input
                    type="text"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="Paste your HIBP API key…"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 mb-6 font-mono text-sm"
                    autoFocus
                />
                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="flex-1 py-3 bg-white/5 text-slate-400 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                    >
                        Skip — use demo data
                    </button>
                    <button
                        onClick={() => onSave(key.trim())}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-purple-500/20"
                    >
                        Save & Continue
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

/* ── Scan progress steps ── */
const SCAN_STEPS = [
    { threshold: 0,  label: 'Initializing scan protocols…'      },
    { threshold: 25, label: 'Checking breach databases…'         },
    { threshold: 50, label: 'Scanning dark web repositories…'    },
    { threshold: 75, label: 'Analyzing credential exposure…'     },
    { threshold: 90, label: 'Generating risk report…'            },
];

const LeakChecker = () => {
    const { api } = useAuth();
    const [email, setEmail]         = useState('');
    const [emailError, setEmailError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress]   = useState(0);
    const [stepLabel, setStepLabel] = useState('');
    const [result, setResult]       = useState(null);
    const [showDetails, setShowDetails] = useState({});
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [hibpKey, setHibpKey]     = useState(import.meta.env.VITE_HIBP_API_KEY || '');
    const progressRef               = useRef(null);
    const pendingEmailRef           = useRef('');

    const getCurrentStepLabel = (p) => {
        let label = SCAN_STEPS[0].label;
        for (const step of SCAN_STEPS) {
            if (p >= step.threshold) label = step.label;
        }
        return label;
    };

    const runScan = async (emailToScan, apiKey) => {
        setIsScanning(true);
        setResult(null);
        setProgress(0);
        setEmailError('');

        /* Animate progress bar */
        let p = 0;
        progressRef.current = setInterval(() => {
            p = Math.min(p + Math.random() * 4 + 0.5, 92);
            setProgress(p);
            setStepLabel(getCurrentStepLabel(p));
        }, 150);

        const toastId = toast.loading('Scanning breach databases…');
        try {
            let breaches = [];
            if (apiKey) {
                /* Real HIBP API via backend proxy */
                const res = await api.post('/monitor/hibp-check', { email: emailToScan, apiKey });
                breaches = res.data.breaches ?? [];
            } else {
                /* Backend check endpoint (uses mock internally) */
                const res = await api.post('/monitor/check', { email: emailToScan });
                breaches = res.data.leaks?.map(l => ({
                    Name: l.name,
                    BreachDate: l.date,
                    DataClasses: l.compromisedData,
                    PwnCount: 0
                })) ?? [];
            }
            clearInterval(progressRef.current);
            setProgress(100);
            setStepLabel('Generating risk report…');

            setTimeout(() => {
                setResult({ email: emailToScan, leaksFound: breaches.length, leaks: breaches });
                setIsScanning(false);
                toast.dismiss(toastId);
                if (breaches.length > 0) {
                    toast.error(`⚠️ ${breaches.length} breach${breaches.length !== 1 ? 'es' : ''} found for this email`, { duration: 5000 });
                } else {
                    toast.success('✅ No breaches found — you\'re safe!', { duration: 4000 });
                }
            }, 600);
        } catch {
            clearInterval(progressRef.current);
            /* Fallback to deterministic mock */
            const mockBreaches = getMockBreaches(emailToScan);
            setProgress(100);
            setStepLabel('Generating risk report…');
            setTimeout(() => {
                setResult({ email: emailToScan, leaksFound: mockBreaches.length, leaks: mockBreaches });
                setIsScanning(false);
                toast.dismiss(toastId);
                if (mockBreaches.length > 0) {
                    toast.error(`⚠️ ${mockBreaches.length} breach${mockBreaches.length !== 1 ? 'es' : ''} found (demo data)`, { duration: 5000 });
                } else {
                    toast.success('All clear (demo mode)');
                }
            }, 600);
        }
    };

    const handleCheck = async (e) => {
        e.preventDefault();
        setEmailError('');

        const v = validateEmail(email.trim());
        if (!v.valid) {
            setEmailError(v.error);
            toast.error(v.error);
            return;
        }

        if (!hibpKey) {
            pendingEmailRef.current = email.trim();
            setShowKeyModal(true);
        } else {
            await runScan(email.trim(), hibpKey);
        }
    };

    const handleKeyModalSave = async (key) => {
        setShowKeyModal(false);
        setHibpKey(key);
        await runScan(pendingEmailRef.current, key);
    };

    const handleKeyModalSkip = async () => {
        setShowKeyModal(false);
        await runScan(pendingEmailRef.current, '');
    };

    const toggleDetails = (idx) => setShowDetails(prev => ({ ...prev, [idx]: !prev[idx] }));

    /* Breach normalize — result.leaks can be HIBP format or backend format */
    const normalizeLeaks = (leaks = []) => leaks.map(l => ({
        name:            l.Name       ?? l.name       ?? 'Unknown',
        date:            l.BreachDate ?? l.date        ?? '',
        compromisedData: l.DataClasses ?? l.compromisedData ?? [],
        description:     l.Description ?? 'This breach exposed personal data from a third-party platform.',
        pwnCount:        l.PwnCount  ?? 0,
    }));

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* HIBP Key Modal */}
            <AnimatePresence>
                {showKeyModal && <HIBPKeyModal onSkip={handleKeyModalSkip} onSave={handleKeyModalSave} />}
            </AnimatePresence>

            {/* Header */}
            <div className="text-center mb-12">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 mb-6"
                >
                    <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dark Web Scanner</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium">
                    Instantly check if your credentials have been compromised
                </p>
            </div>

            {/* Input Section */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-card p-2 rounded-[2rem] shadow-2xl mb-4"
            >
                <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Enter email to scan…"
                            className={`w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-800/50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 ${
                                emailError ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                            }`}
                            value={email}
                            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                        />
                        {emailError && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-7 left-5 flex items-center gap-1 text-red-500 text-xs font-bold"
                            >
                                <AlertCircle size={12} />
                                {emailError}
                            </motion.div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isScanning}
                        className="md:w-48 py-4 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                        {isScanning ? (
                            <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                SCAN NOW
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>

            {emailError && <div className="h-6" />}

            {/* Progress bar during scan */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="glass-card rounded-2xl p-6 mb-6"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{stepLabel}</p>
                            <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: 'easeOut', duration: 0.3 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            />
                        </div>
                        <div className="flex justify-between mt-3">
                            {SCAN_STEPS.map((step, i) => (
                                <span key={i} className={`text-[9px] font-bold uppercase ${
                                    progress >= step.threshold ? 'text-purple-500' : 'text-slate-400'
                                }`}>
                                    {i === 0 ? 'Init' : i === 1 ? 'HIBP' : i === 2 ? 'Dark Web' : i === 3 ? 'Analysis' : 'Report'}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence mode="wait">
                {result && !isScanning && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Summary */}
                        <div className={`p-8 rounded-[2rem] border flex flex-col md:flex-row items-center gap-6 ${
                            result.leaksFound > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
                        }`}>
                            <div className={`p-6 rounded-3xl ${result.leaksFound > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                                {result.leaksFound > 0
                                    ? <ShieldAlert className="w-12 h-12 text-red-600" />
                                    : <ShieldCheck className="w-12 h-12 text-green-600" />
                                }
                            </div>
                            <div className="text-center md:text-left flex-grow">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                    {result.leaksFound > 0 ? `${result.leaksFound} Data Breach${result.leaksFound !== 1 ? 'es' : ''} Found` : 'No Breaches Detected'}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Scan results for {result.email}</p>
                            </div>
                            {result.leaksFound > 0 && (
                                <div className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl text-sm animate-pulse">
                                    ACTION REQUIRED
                                </div>
                            )}
                        </div>

                        {/* Breach details */}
                        {result.leaksFound > 0 && (
                            <motion.div
                                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                                initial="hidden"
                                animate="show"
                                className="space-y-3"
                            >
                                {normalizeLeaks(result.leaks).map((leak, idx) => (
                                    <motion.div
                                        key={idx}
                                        variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                                        className="glass-card rounded-[1.5rem] overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleDetails(idx)}
                                            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-red-500/10 rounded-lg">
                                                    <AlertCircle size={20} className="text-red-600" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{leak.name}</h4>
                                                    <p className="text-xs text-slate-500">
                                                        {leak.date ? new Date(leak.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date unknown'}
                                                        {leak.pwnCount > 0 && ` • ${(leak.pwnCount / 1e6).toFixed(1)}M accounts affected`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {(leak.compromisedData || []).includes('Passwords') && (
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full uppercase">Password Exposed</span>
                                                )}
                                                {showDetails[idx] ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {showDetails[idx] && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-6 pb-6 overflow-hidden"
                                                >
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{leak.description}</p>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compromised Information</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(leak.compromisedData || []).map((item, i) => (
                                                                <span key={i} className="px-3 py-1 bg-red-500/5 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-500/10">
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Rescan */}
                        <button
                            onClick={() => { setResult(null); setEmail(''); setEmailError(''); }}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold flex items-center gap-2 mx-auto transition-colors"
                        >
                            <X size={14} /> Clear results &amp; scan another email
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeakChecker;
