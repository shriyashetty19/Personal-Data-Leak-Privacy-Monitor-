import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingUp, Search, Lock, Globe, AlertCircle } from 'lucide-react';

const RiskAnalysis = ({ vectors }) => {
    const defaultVectors = [
        { name: 'Credential Stuffing', risk: 85, icon: 'Lock' },
        { name: 'Phishing Target', risk: 42, icon: 'Search' },
        { name: 'Domain Spoofing', risk: 68, icon: 'Globe' },
        { name: 'API Exposure', risk: 15, icon: 'ShieldAlert' },
    ];

    const iconMap = {
        Lock: Lock,
        Search: Search,
        Globe: Globe,
        ShieldAlert: ShieldAlert
    };

    const displayVectors = vectors || defaultVectors;

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="text-purple-500" />
                    AI Risk Vector Analysis
                </h3>
                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest">
                    Real-Time Insight
                </div>
            </div>

            <div className="space-y-6">
                {displayVectors.map((vector, i) => {
                    const Icon = iconMap[vector.icon] || Lock;
                    return (
                        <div key={i} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-slate-400 group-hover:text-purple-400 transition-colors">
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-300">{vector.name}</span>
                                </div>
                                <span className={`text-xs font-black ${vector.risk > 70 ? 'text-red-500' : vector.risk > 40 ? 'text-amber-500' : 'text-green-500'}`}>
                                    {vector.risk}% RISK
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${vector.risk}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className={`h-full rounded-full ${
                                        vector.risk > 70 ? 'bg-red-500' : vector.risk > 40 ? 'bg-amber-500' : 'bg-green-500'
                                    } shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-red-500 shrink-0 mt-1" />
                <div>
                    <p className="text-white text-xs font-bold mb-1">DYNAMIC VULNERABILITY ADVISORY</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                        Risk levels are calculated based on your personal breach history and monitored assets. {displayVectors.length > 0 && displayVectors[0].risk > 50 ? 'Immediate password rotation is advised.' : 'Your security posture is stable.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiskAnalysis;
