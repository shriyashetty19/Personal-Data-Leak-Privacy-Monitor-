import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [showMfa, setShowMfa] = useState(false);
    const [mfaUserId, setMfaUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginMFA } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            if (showMfa) {
                const res = await loginMFA(mfaUserId, mfaToken);
                if (res.success) {
                    toast.success('Welcome back!');
                    navigate('/dashboard');
                } else {
                    toast.error(res.error || 'Invalid 2FA code');
                }
            } else {
                const res = await login(email, password);
                if (res.success) {
                    toast.success('Welcome back!');
                    navigate('/dashboard');
                } else if (res.mfaRequired) {
                    setShowMfa(true);
                    setMfaUserId(res.userId);
                    toast.success('Credentials verified. Please enter 2FA code.');
                } else if (res.requiresVerification) {
                    toast.error('Account not verified. Redirecting...');
                    navigate('/verify', { state: { email } });
                } else {
                    toast.error(res.error || 'Invalid credentials');
                }
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="perfect-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
                            <Shield className="h-10 w-10 text-purple-600 dark:text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">PrivacyMonitor</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Enterprise-grade data protection</p>
                </div>

                <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please enter your account details</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!showMfa ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                            <Mail size={16} className="text-purple-500" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                            <Lock size={16} className="text-purple-500" />
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        <Shield size={16} className="text-purple-500" />
                                        Two-Factor Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-slate-900 dark:text-white text-center text-2xl tracking-[0.5em] font-mono"
                                        placeholder="000000"
                                        value={mfaToken}
                                        onChange={(e) => setMfaToken(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowMfa(false)}
                                        className="text-xs text-purple-500 hover:text-purple-400 font-bold"
                                    >
                                        Back to login
                                    </button>
                                </motion.div>
                            )}
                            
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group/btn flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-purple-600 dark:text-purple-400 font-bold hover:text-purple-500 transition-colors underline-offset-4 hover:underline">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
