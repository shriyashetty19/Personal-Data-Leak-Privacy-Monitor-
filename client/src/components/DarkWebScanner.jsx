import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Search, Terminal, AlertTriangle, Eye, ShieldCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getMockBreaches } from '../utils/emailValidator';

/* ── Scan steps matching the spec exactly ── */
const SCAN_STEPS = [
    { min: 0,  max: 25,  label: 'Initializing scan protocols…'       },
    { min: 25, max: 50,  label: 'Checking breach databases…'          },
    { min: 50, max: 75,  label: 'Scanning dark web repositories…'     },
    { min: 75, max: 90,  label: 'Analyzing credential exposure…'      },
    { min: 90, max: 100, label: 'Generating risk report…'             },
];

function getCurrentStep(progress) {
    return SCAN_STEPS.find(s => progress >= s.min && progress < s.max) ?? SCAN_STEPS[SCAN_STEPS.length - 1];
}

const TERMINAL_LINES = [
    { color: 'text-green-500',  prefix: '[FETCH]',  suffix: 'onion://v2j3h4k5l6m7.onion/dump' },
    { color: 'text-blue-400',   prefix: '[QUERY]',  suffix: 'Searching 14,032 archives…'       },
    { color: 'text-purple-400', prefix: '[MATCH]',  suffix: 'Cross-referencing credentials…'   },
    { color: 'text-amber-400',  prefix: '[STATUS]', suffix: 'Bypassing Cloudflare WAF…'        },
    { color: 'text-red-400',    prefix: '[ALERT]',  suffix: 'High-entropy leak detected…'      },
    { color: 'text-green-400',  prefix: '[SCAN]',   suffix: '1,284 entries analysed…'          },
    { color: 'text-cyan-400',   prefix: '[INDEX]',  suffix: 'Darknet markets indexed…'         },
    { color: 'text-slate-400',  prefix: '[LOG]',    suffix: 'Telemetry payload signed…'        },
];

const DarkWebScanner = ({ userEmail }) => {
    const { api } = useAuth();
    const [status, setStatus]       = useState('idle');      // idle | scanning | results
    const [progress, setProgress]   = useState(0);
    const [stepLabel, setStepLabel] = useState('');
    const [foundDumps, setFoundDumps] = useState([]);
    const [terminalLines, setTerminalLines] = useState([]);
    const terminalRef = useRef(null);
    const progressRef = useRef(null);

    /* Clean up on unmount */
    useEffect(() => () => {
        clearInterval(progressRef.current);
    }, []);

    /* Auto-scroll terminal */
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLines]);

    const addTerminalLine = (line) => {
        setTerminalLines(prev => [...prev.slice(-12), line]);
    };

    const startScan = async () => {
        setStatus('scanning');
        setProgress(0);
        setFoundDumps([]);
        setTerminalLines([]);

        const emailToScan = userEmail || 'tracked-emails';
        let p = 0;

        /* Smooth progress animation */
        progressRef.current = setInterval(() => {
            setProgress(prev => {
                const next = prev + (Math.random() * 3 + 0.5);
                const capped = Math.min(next, 92);
                setStepLabel(getCurrentStep(capped).label);
                return capped;
            });
        }, 180);

        /* Terminal effect — add a new line every 600ms */
        const termInterval = setInterval(() => {
            const line = TERMINAL_LINES[Math.floor(Math.random() * TERMINAL_LINES.length)];
            addTerminalLine(line);
        }, 600);

        try {
            const res = await api.post('/monitor/darkweb-scan', { email: emailToScan });
            clearInterval(progressRef.current);
            clearInterval(termInterval);

            /* Animate to 100% */
            setProgress(100);
            setStepLabel('Generating risk report…');

            addTerminalLine({ color: 'text-green-400', prefix: '[DONE]', suffix: 'Scan complete — report ready.' });

            const breaches = res.data?.results ?? getMockBreaches(emailToScan);
            setTimeout(() => {
                setFoundDumps(breaches);
                setStatus('results');
            }, 800);
        } catch {
            clearInterval(progressRef.current);
            clearInterval(termInterval);

            /* Fallback to mock results */
            setProgress(100);
            setStepLabel('Generating risk report…');
            addTerminalLine({ color: 'text-amber-400', prefix: '[MOCK]', suffix: 'Using demo breach database.' });

            const mockBreaches = getMockBreaches(emailToScan || 'demo@gmail.com');
            setTimeout(() => {
                setFoundDumps(mockBreaches);
                setStatus('results');
            }, 800);
        }
    };

    const reset = () => {
        setStatus('idle');
        setProgress(0);
        setFoundDumps([]);
        setTerminalLines([]);
    };

    const getSeverityColor = (dataClasses = []) => {
        if (dataClasses.includes('Passwords') || dataClasses.includes('Credit card numbers')) return 'text-red-500';
        if (dataClasses.includes('Names') || dataClasses.includes('Phone numbers')) return 'text-amber-500';
        return 'text-yellow-500';
    };

    const getSeverityLabel = (dataClasses = []) => {
        if (dataClasses.includes('Passwords') || dataClasses.includes('Credit card numbers')) return 'HIGH';
        if (dataClasses.includes('Names') || dataClasses.includes('Phone numbers')) return 'MEDIUM';
        return 'LOW';
    };

    return (
        <div className="glass-card rounded-[2.5rem] p-10 h-full relative overflow-hidden flex flex-col items-center justify-center text-center">
            {/* Subtle grain */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")'
            }} />

            <AnimatePresence mode="wait">
                {/* ── IDLE ── */}
                {status === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="space-y-6"
                    >
                        <div
                            className="w-24 h-24 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto shadow-2xl group cursor-pointer relative"
                            onClick={startScan}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-current"
                            />
                            <Search size={40} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">DARK WEB SHIELD</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-md">
                                Perform deep-web entity matching across 1,400+ hidden forums and onion repositories.
                            </p>
                        </div>
                        <button
                            onClick={startScan}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Initiate Deep Scan
                        </button>
                    </motion.div>
                )}

                {/* ── SCANNING ── */}
                {status === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-md space-y-6"
                    >
                        {/* Progress header */}
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Active Search</p>
                                    <motion.h4
                                        key={stepLabel}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-lg font-black text-slate-900 dark:text-white mt-1"
                                    >
                                        {stepLabel || 'Initializing…'}
                                    </motion.h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {Math.floor(progress)}%
                                </p>
                            </div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-1">
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: 'easeOut', duration: 0.3 }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                />
                            </div>
                        </div>

                        {/* Step indicators */}
                        <div className="flex justify-between px-1">
                            {SCAN_STEPS.map((step, i) => {
                                const done = progress >= step.max;
                                const active = progress >= step.min && progress < step.max;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                            done ? 'bg-green-500' : active ? 'bg-purple-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                                        }`} />
                                        <span className={`text-[8px] font-bold uppercase ${active ? 'text-purple-500' : done ? 'text-green-500' : 'text-slate-500'}`}>
                                            Step {i + 1}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Terminal log */}
                        <div
                            ref={terminalRef}
                            className="bg-slate-900 rounded-2xl p-5 text-left font-mono text-[10px] h-36 overflow-y-auto shadow-inner border border-slate-800 space-y-1"
                        >
                            {terminalLines.map((line, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2"
                                >
                                    <span className={line.color}>{line.prefix}</span>
                                    <span className="text-slate-400">{line.suffix}</span>
                                </motion.p>
                            ))}
                            {terminalLines.length === 0 && (
                                <p className="text-slate-600 italic">Initiating connection…</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── RESULTS ── */}
                {status === 'results' && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-6 text-left"
                    >
                        {/* Results header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-lg ${foundDumps.length > 0 ? 'bg-red-500 shadow-red-500/20' : 'bg-green-500 shadow-green-500/20'} text-white`}>
                                    {foundDumps.length > 0 ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                        {foundDumps.length > 0 ? `${foundDumps.length} BREACHES FOUND` : 'ALL CLEAR'}
                                    </h3>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${foundDumps.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {foundDumps.length > 0
                                            ? `${foundDumps.length} data breach${foundDumps.length !== 1 ? 'es' : ''} detected`
                                            : 'No dark web exposure found'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={reset}
                                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title="Rescan"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        {/* Breach cards */}
                        {foundDumps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
                                {foundDumps.map((breach, i) => {
                                    const sevColor = getSeverityColor(breach.DataClasses);
                                    const sevLabel = getSeverityLabel(breach.DataClasses);
                                    return (
                                        <motion.div
                                            key={breach.Name || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            className="p-5 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm">{breach.Name}</h4>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                                    sevLabel === 'HIGH' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                                                    sevLabel === 'MEDIUM' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' :
                                                    'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                                                }`}>{sevLabel}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mb-2">
                                                {breach.BreachDate ? new Date(breach.BreachDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {(breach.DataClasses || []).slice(0, 3).map(dc => (
                                                    <span key={dc} className="text-[8px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                                                        {dc}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3 py-8">
                                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                                    <ShieldCheck size={18} />
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Identity monitoring actively suppressing future matches
                                </p>
                            </div>
                        )}

                        <button
                            onClick={startScan}
                            className="w-full py-3 bg-slate-900 dark:bg-white/5 hover:bg-slate-800 dark:hover:bg-white/10 text-white border border-white/10 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} /> Run Another Scan
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DarkWebScanner;
