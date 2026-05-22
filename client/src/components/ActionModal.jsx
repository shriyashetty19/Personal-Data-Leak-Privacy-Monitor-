import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Key, Lock, AlertTriangle } from 'lucide-react';

const ActionModal = ({ isOpen, onClose, actionType, breachName, email }) => {
    if (!isOpen) return null;

    const actions = {
        password: {
            title: 'Change Password',
            description: `The breach at ${breachName} exposed your password. You should change it immediately on that platform and any other site where you use the same password.`,
            steps: [
                'Log in to the affected service',
                'Navigate to Security or Account Settings',
                'Choose a strong, unique password (12+ characters)',
                'Update your password manager'
            ],
            icon: <Key className="text-blue-500" size={24} />,
            color: 'blue'
        },
        tfa: {
            title: 'Enable 2FA',
            description: 'Two-Factor Authentication adds an extra layer of security. Even if a hacker gets your password, they won\'t be able to access your account without your phone/app.',
            steps: [
                'Download an authenticator app (Google, Authy)',
                'Scan the QR code provided by the service',
                'Save your backup codes in a safe place',
                'Verify the setup with a 6-digit code'
            ],
            icon: <Lock className="text-purple-500" size={24} />,
            color: 'purple'
        },
        remove: {
            title: 'Remove Risky Asset',
            description: `Stop monitoring ${email}? This will stop future alerts but your historical data for this asset will be archived.`,
            steps: [
                'Understand that you will no longer receive live updates',
                'Historical breach data for this email will remain in logs',
                'You can re-add this email anytime'
            ],
            icon: <AlertTriangle className="text-amber-500" size={24} />,
            color: 'amber'
        }
    };

    const action = actions[actionType] || actions.password;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg glass-card rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className={`p-4 bg-${action.color}-500/10 rounded-2xl`}>
                            {action.icon}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{action.title}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Recommended Action</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                        {action.description}
                    </p>

                    <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Step-by-step Guide:</h4>
                        {action.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 group">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    {idx + 1}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{step}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                    >
                        I've completed this step
                    </button>
                    
                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                            <ShieldCheck size={12} className="text-green-500" />
                            Verified Security Protocol
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ActionModal;
