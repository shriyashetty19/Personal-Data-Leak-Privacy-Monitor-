import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, ShieldAlert } from 'lucide-react';

const ExposureMap = ({ totalAlerts = 0, breachLocations = [], riskDensity = 'STABLE' }) => {
    const regionCounts = {
        'North America': 0,
        'Europe': 0,
        'Asia Pacific': 0,
        'South America': 0,
        'Africa': 0,
        'Middle East': 0
    };

    breachLocations.forEach(loc => {
        if (regionCounts[loc.region] !== undefined) {
            regionCounts[loc.region]++;
        }
    });

    const locations = [
        { id: 1, name: 'North America', x: '26%', y: '35%', leaks: regionCounts['North America'], color: regionCounts['North America'] > 5 ? 'red' : 'amber' },
        { id: 2, name: 'Europe', x: '52%', y: '30%', leaks: regionCounts['Europe'], color: regionCounts['Europe'] > 10 ? 'red' : 'amber' },
        { id: 3, name: 'Asia Pacific', x: '78%', y: '45%', leaks: regionCounts['Asia Pacific'], color: regionCounts['Asia Pacific'] > 3 ? 'red' : 'amber' },
        { id: 4, name: 'South America', x: '35%', y: '70%', leaks: regionCounts['South America'], color: 'blue' },
        { id: 5, name: 'Africa', x: '54%', y: '58%', leaks: regionCounts['Africa'], color: 'blue' },
        { id: 6, name: 'Middle East', x: '62%', y: '42%', leaks: regionCounts['Middle East'], color: 'red' },
    ];

    const maxRegion = Object.keys(regionCounts).reduce((a, b) => regionCounts[a] > regionCounts[b] ? a : b, 'North America');

    return (
        <div className="glass-card rounded-[2.5rem] p-8 h-full relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-slate-900 dark:text-white font-black flex items-center gap-3">
                    <Globe size={20} className="text-blue-500" />
                    IDENTITY EXPOSURE MAP
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">Global Reach</span>
            </div>

            <div className="relative aspect-video bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Simplified Stylized World Map SVG */}
                <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20 dark:opacity-10 fill-slate-400 dark:fill-slate-600">
                    <path d="M150,150 Q200,100 250,150 T350,150 T450,150 T550,150 T650,150 T750,150 T850,150" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                    <circle cx="500" cy="250" r="200" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                    <circle cx="500" cy="250" r="100" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                </svg>

                {/* Animated Leak Pins */}
                {locations.map((loc) => (
                    <motion.div
                        key={loc.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: loc.id * 0.2 }}
                        className="absolute cursor-pointer group/pin"
                        style={{ left: loc.x, top: loc.y }}
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`absolute -inset-4 rounded-full ${loc.color === 'red' ? 'bg-red-500/30' : loc.color === 'amber' ? 'bg-amber-500/30' : 'bg-blue-500/30'}`}
                            />
                            <div className={`relative w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-lg ${loc.color === 'red' ? 'bg-red-500' : loc.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/pin:block z-20">
                                    <div className="bg-slate-900 text-white text-[10px] font-black py-2 px-3 rounded-lg whitespace-nowrap shadow-2xl">
                                        {loc.name}: {loc.leaks} INCIDENTS
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Scanning Line Effect */}
                <motion.div
                    animate={{ x: [-100, 1100] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent pointer-events-none"
                />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Max Intensity</p>
                    <p className="text-lg font-black text-red-500 uppercase">{maxRegion.split(' ')[0]}</p>
                </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Detected Nodes</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{totalAlerts}</p>
                </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Risk Density</p>
                    <p className="text-lg font-black text-amber-500 uppercase">{riskDensity}</p>
                </div>
            </div>
        </div>
    );
};

export default ExposureMap;
