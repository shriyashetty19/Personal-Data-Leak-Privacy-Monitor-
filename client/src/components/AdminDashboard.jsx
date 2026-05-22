import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, ShieldAlert, Activity, Database,
    BarChart3, Globe, ArrowUpRight, ArrowDownRight,
    Search, Filter, X, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { downloadAuditLog } from '../utils/emailValidator';

const INITIAL_USERS = [
    { id: 1, name: 'John Doe',    email: 'john@example.com',   status: 'High Risk', score: 42 },
    { id: 2, name: 'Sarah Smith', email: 'sarah.s@test.com',   status: 'Secured',   score: 95 },
    { id: 3, name: 'Mike Ross',   email: 'mike@law.corp',       status: 'Elevated',  score: 68 },
    { id: 4, name: 'Emma Wilson', email: 'emma.w@gmail.com',   status: 'Secured',   score: 88 },
];

const SYSTEM_LOGS = [
    { color: 'bg-red-500',   event: 'Brute Force Attempt Deflected', meta: 'IP: 192.168.1.104 • 2 MINS AGO'  },
    { color: 'bg-green-500', event: 'System Core Upgraded',           meta: 'V2.4.0 DEPLOYED • 5 HOURS AGO'  },
    { color: 'bg-amber-500', event: 'API Threshold Warning',          meta: '94% USAGE • 1 DAY AGO'           },
];

const RevokeModal = ({ user, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#161625] border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Revoke Access?</h3>
            <p className="text-slate-400 text-sm mb-8">
                This will immediately revoke <span className="text-white font-bold">{user.name}</span>'s access to PrivacyMonitor. They will be logged out of all sessions.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 bg-white/5 text-slate-300 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                    Revoke Access
                </button>
            </div>
        </motion.div>
    </div>
);

const AdminDashboard = () => {
    const [users, setUsers]         = useState(INITIAL_USERS);
    const [search, setSearch]       = useState('');
    const [revokeTarget, setRevokeTarget] = useState(null);

    const stats = [
        { id: 1, name: 'Total Users',      value: users.length.toLocaleString(),  trend: '+12%', icon: <Users     className="text-blue-500"   /> },
        { id: 2, name: 'Active Alerts',    value: '432',                           trend: '-5%',  icon: <ShieldAlert className="text-red-500" /> },
        { id: 3, name: 'Scans Performed',  value: '14,802',                        trend: '+18%', icon: <Activity  className="text-green-500"  /> },
        { id: 4, name: 'Database Size',    value: '4.2 TB',                        trend: '+2%',  icon: <Database  className="text-purple-500" /> },
    ];

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleRevoke = () => {
        setUsers(prev => prev.filter(u => u.id !== revokeTarget.id));
        toast.success(`Access revoked for ${revokeTarget.name}`);
        setRevokeTarget(null);
    };

    const handleDownloadAuditLog = () => {
        const events = [
            ...SYSTEM_LOGS.map(l => ({ event: l.event, ip: '192.168.1.x', timestamp: new Date().toISOString(), status: 'info' })),
            { event: 'Admin Console Accessed', ip: '203.0.113.1', timestamp: new Date().toISOString(), status: 'success' },
        ];
        downloadAuditLog(events);
        toast.success('Audit log downloaded!');
    };

    return (
        <>
            <AnimatePresence>
                {revokeTarget && (
                    <RevokeModal
                        user={revokeTarget}
                        onConfirm={handleRevoke}
                        onCancel={() => setRevokeTarget(null)}
                    />
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Enterprise Console</h2>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Global System Oversight</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 border-transparent transition-all text-slate-900 dark:text-white"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map(stat => (
                        <motion.div
                            key={stat.id}
                            whileHover={{ y: -5 }}
                            className="glass-card rounded-3xl p-6 border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">{stat.icon}</div>
                                <span className={`flex items-center gap-1 text-xs font-black ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                    {stat.trend}
                                    {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </span>
                            </div>
                            <h4 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.name}</h4>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* User Table + System Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Risk Table */}
                    <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <BarChart3 size={20} className="text-purple-500" />
                            USER RISK PROFILES
                            {search && (
                                <span className="text-xs font-normal text-slate-400">
                                    — {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-4 pt-2">Identity</th>
                                        <th className="pb-4 pt-2">Security Score</th>
                                        <th className="pb-4 pt-2">Status</th>
                                        <th className="pb-4 pt-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-10 text-center text-slate-500 text-sm">
                                                No users match your search.
                                            </td>
                                        </tr>
                                    ) : filtered.map(u => (
                                        <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-sm">
                                                        {u.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{u.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold mt-1">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${u.score}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                            className={`h-full rounded-full ${u.score > 80 ? 'bg-green-500' : u.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{u.score}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                                                    u.status === 'Secured'   ? 'bg-green-500/10 text-green-500'  :
                                                    u.status === 'Elevated'  ? 'bg-amber-500/10 text-amber-500'  :
                                                                               'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => setRevokeTarget(u)}
                                                    className="text-[10px] font-black uppercase text-purple-500 hover:text-red-400 hover:underline transition-colors"
                                                >
                                                    Revoke Access
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* System Logs */}
                    <div className="lg:col-span-1 glass-card rounded-[2.5rem] p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Globe size={120} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 relative z-10">
                            <ShieldAlert size={20} className="text-red-500" />
                            SYSTEM LOGS
                        </h3>
                        <div className="space-y-6 relative z-10">
                            {SYSTEM_LOGS.map((log, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`w-1 h-12 ${log.color} rounded-full flex-shrink-0`} />
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white">{log.event}</p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{log.meta}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleDownloadAuditLog}
                            className="w-full mt-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 flex items-center justify-center gap-2"
                        >
                            <Download size={14} />
                            Download Audit Logs
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default AdminDashboard;
