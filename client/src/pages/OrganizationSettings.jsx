import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, UserPlus, X, Check, Plus, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../utils/emailValidator';

/* ── Avatar colours cycling ── */
const AVATAR_COLORS = [
    'bg-purple-500','bg-blue-500','bg-green-500','bg-pink-500',
    'bg-amber-500','bg-cyan-500','bg-red-500','bg-indigo-500',
];

/* ── Create Team Modal ── */
const CreateTeamModal = ({ onClose, onCreate }) => {
    const [name, setName]           = useState('');
    const [domain, setDomain]       = useState('');
    const [description, setDesc]    = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [members, setMembers]     = useState([]);
    const [emailError, setEmailError]   = useState('');
    const [domainError, setDomainError] = useState('');
    const [loading, setLoading]     = useState(false);

    const validateDomain = (d) => {
        const regex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        return regex.test(d);
    };

    const handleAddMember = () => {
        setEmailError('');
        const v = validateEmail(memberEmail.trim());
        if (!v.valid) { setEmailError(v.error); return; }
        if (members.includes(memberEmail.trim())) { setEmailError('Already added'); return; }
        setMembers(prev => [...prev, memberEmail.trim()]);
        setMemberEmail('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Team name is required'); return; }
        if (domain && !validateDomain(domain)) { setDomainError("Enter a valid domain (e.g. company.com)"); return; }
        setLoading(true);
        setTimeout(() => {
            onCreate({ name: name.trim(), domain: domain.trim(), description: description.trim(), members });
            toast.success(`Team "${name}" created!`);
            onClose();
            setLoading(false);
        }, 600);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#0d0d1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg relative shadow-2xl"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-1">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Create New Team</h2>
                        <p className="text-xs text-slate-500">Set up your organization workspace</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Team Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Team Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Acme Security Team"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Domain */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Organization Domain</label>
                        <input
                            type="text"
                            value={domain}
                            onChange={e => { setDomain(e.target.value); setDomainError(''); }}
                            placeholder="company.com"
                            className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors ${
                                domainError ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
                            }`}
                        />
                        {domainError && <p className="text-xs text-red-400 mt-1">{domainError}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="What does this team monitor?"
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Invite Members */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Invite Members</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={memberEmail}
                                onChange={e => { setMemberEmail(e.target.value); setEmailError(''); }}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                                placeholder="colleague@company.com"
                                className={`flex-1 bg-white/5 border rounded-2xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-colors text-sm ${
                                    emailError ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={handleAddMember}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-1"
                            >
                                <Plus size={14} /> Add
                            </button>
                        </div>
                        {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}

                        {/* Member chips */}
                        {members.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {members.map((m, i) => (
                                    <motion.div
                                        key={m}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-300"
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                                            {m[0].toUpperCase()}
                                        </div>
                                        <span className="max-w-[140px] truncate">{m}</span>
                                        <button
                                            type="button"
                                            onClick={() => setMembers(prev => prev.filter(x => x !== m))}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 text-slate-300 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Check size={16} />
                            )}
                            Create Team
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

/* ── Team Card ── */
const TeamCard = ({ team }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-purple-500/30 transition-all"
    >
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                {team.name[0]}
            </div>
            <div>
                <h3 className="font-bold text-white">{team.name}</h3>
                {team.domain && <p className="text-xs text-slate-500">{team.domain}</p>}
            </div>
        </div>
        {team.description && <p className="text-sm text-slate-400 mb-4">{team.description}</p>}
        <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
                {team.members.slice(0, 5).map((m, i) => (
                    <div
                        key={m}
                        title={m}
                        className={`w-8 h-8 rounded-full border-2 border-[#0d0d1a] ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[10px] font-bold text-white`}
                    >
                        {m[0].toUpperCase()}
                    </div>
                ))}
                {team.members.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-[#0d0d1a] bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        +{team.members.length - 5}
                    </div>
                )}
            </div>
            <span className="text-xs text-slate-500 font-bold">
                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </span>
        </div>
    </motion.div>
);

/* ── Main Page ── */
const OrganizationSettings = () => {
    const [teams, setTeams]         = useState([]);
    const [showModal, setShowModal] = useState(false);

    const handleCreate = (teamData) => {
        setTeams(prev => [...prev, { ...teamData, id: Date.now() }]);
    };

    return (
        <div className="min-h-screen">
            {/* Light header strip */}
            <div className="bg-white dark:bg-transparent border-b border-slate-100 dark:border-white/5 px-6 py-8">
                <div className="container mx-auto max-w-5xl">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your organizations and invite team members.</p>
                </div>
            </div>

            {/* Dark body */}
            <div className="bg-[#0d0d1a] min-h-[calc(100vh-120px)] px-6 py-12">
                <div className="container mx-auto max-w-5xl">
                    {/* Modal */}
                    <AnimatePresence>
                        {showModal && (
                            <CreateTeamModal
                                onClose={() => setShowModal(false)}
                                onCreate={handleCreate}
                            />
                        )}
                    </AnimatePresence>

                    {teams.length === 0 ? (
                        /* Empty state */
                        <div className="flex items-center justify-center py-20">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center bg-white/5 border border-white/10 rounded-[2.5rem] p-16 max-w-lg w-full"
                            >
                                <Globe className="w-16 h-16 text-slate-600 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-3">No Organizations Found</h2>
                                <p className="text-slate-400 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
                                    Create a team to start monitoring assets for your entire organization and collaborate with colleagues.
                                </p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={18} />
                                    Create Your First Team
                                </button>
                            </motion.div>
                        </div>
                    ) : (
                        /* Teams grid */
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-white">
                                    Your Teams <span className="text-slate-500 font-normal text-sm ml-2">({teams.length})</span>
                                </h2>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
                                >
                                    <UserPlus size={16} />
                                    New Team
                                </button>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teams.map(team => <TeamCard key={team.id} team={team} />)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationSettings;
