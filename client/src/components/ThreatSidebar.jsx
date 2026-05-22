import React from 'react';
import { motion } from 'framer-motion';
import { Radio, ShieldAlert, Globe, ExternalLink } from 'lucide-react';

const ThreatSidebar = () => {
    const threats = [
        { id: 1, site: 'Ledger Wallet', users: '270K', date: '2 hours ago', type: 'Database Leak' },
        { id: 2, site: 'AT&T Mobile', users: '73M', date: '5 hours ago', type: 'Customer Records' },
        { id: 3, site: 'Discord.io', users: '760K', date: '1 day ago', type: 'Partial Dump' },
        { id: 4, site: 'Duolingo', users: '2.6M', date: '2 days ago', type: 'Email Scrape' },
        { id: 5, site: 'MoveIt Transfer', users: 'Various', date: 'Ongoing', type: 'Zero-Day' },
        { id: 6, site: 'ChatGPT Plus', users: 'Unknown', date: 'Recently', type: 'Payment Info' },
    ];

    return (
        <div className="glass-card rounded-[2.5rem] p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-slate-900 dark:text-white font-black flex items-center gap-3">
                    <Radio size={20} className="text-red-500 animate-pulse" />
                    GLOBAL INTELLIGENCE
                </h3>
                <Globe size={18} className="text-slate-400" />
            </div>

            <div className="flex-grow space-y-6 overflow-hidden">
                <motion.div 
                    animate={{ y: [0, -200] }}
                    transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="space-y-6"
                >
                    {[...threats, ...threats].map((threat, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-transparent hover:border-red-500/10 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                    {threat.type}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold">{threat.date}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{threat.site}</h4>
                            <div className="flex items-center justify-between mt-3">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Impact: {threat.users} records</p>
                                <ExternalLink size={12} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                    <ShieldAlert size={16} className="text-red-500" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">
                        High Volatility Detected in Dark Web Forums
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ThreatSidebar;
