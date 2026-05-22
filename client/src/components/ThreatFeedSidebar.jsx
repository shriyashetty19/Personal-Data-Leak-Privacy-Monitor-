import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ThreatFeedSidebar() {
    const [threats, setThreats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { api } = useAuth();

    const fetchRealThreats = async () => {
        try {
            const res = await api.get('/monitor/global-threats');
            if (res.data && Array.isArray(res.data)) {
                const threatsData = res.data.map(t => ({
                    id: t.name,
                    source: t.name,
                    data: `${(t.exposedCount / 1000000).toFixed(1)}M Records Exposed`,
                    time: new Date(t.date).toLocaleDateString(),
                    severity: t.riskLevel,
                    industry: t.industry,
                    dataTypes: t.dataTypes
                }));
                setThreats(threatsData);
            }
        } catch (error) {
            console.error('Failed to fetch real threats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealThreats();
        const interval = setInterval(fetchRealThreats, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
            <h2 className="text-xl font-black mb-6 flex items-center text-white uppercase tracking-tighter">
                <Globe className="mr-2 text-blue-500 animate-pulse" /> Global Intel Feed
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-slate-500" />
                    </div>
                ) : threats.map((threat) => (
                    <div key={threat.id} className="bg-slate-900/40 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-slate-200 tracking-tight">{threat.source}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center uppercase tracking-widest ${
                                    threat.severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                                    threat.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                    threat.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-blue-500/20 text-blue-500'
                                }`}>
                                    {threat.severity}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-1 font-medium">{threat.data}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded uppercase font-black">{threat.industry}</span>
                                {threat.dataTypes.slice(0, 2).map((dt, i) => (
                                    <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-black">{dt}</span>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 flex justify-between font-bold">
                                <span>Reported: {threat.time}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 cursor-pointer">Analysis</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-center text-slate-600 mt-4 font-black uppercase tracking-[0.2em]">Verified Threat Intel v2.4</p>
        </div>
    );
}
