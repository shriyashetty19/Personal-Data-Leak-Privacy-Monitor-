import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Key, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const { verifyEmail, resendOTP } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get email from query params or location state
    const email = new URLSearchParams(location.search).get('email') || location.state?.email;

    useEffect(() => {
        if (!email) {
            toast.error('Session expired. Please sign up again.');
            navigate('/signup');
        }
    }, [email, navigate]);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== '') {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (otp[index] === '' && e.target.previousSibling) {
                e.target.previousSibling.focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return toast.error('Enter 6-digit code');
        
        setIsLoading(true);
        const res = await verifyEmail(email, code);
        setIsLoading(false);

        if (res.success) {
            toast.success('Account verified! Welcome to Privacy Shield PRO.');
            navigate('/dashboard');
        } else {
            toast.error(res.error);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        
        const res = await resendOTP(email);
        if (res.success) {
            toast.success('New code sent to your email');
            setResendTimer(60);
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="perfect-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-purple-500/10 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 animate-pulse">
                            <Key className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Verify Identity</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Verification code sent to <span className="text-slate-900 dark:text-white font-bold">{email}</span>
                    </p>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className="w-12 h-14 text-center text-xl font-black bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                                    value={data}
                                    onChange={e => handleChange(e.target, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    VERIFY ACCOUNT
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                            className={`flex items-center gap-2 mx-auto text-sm font-bold transition-all ${
                                resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-purple-600 dark:text-purple-400 hover:scale-105'
                            }`}
                        >
                            <RefreshCw size={16} className={resendTimer > 0 ? '' : 'animate-spin-slow'} />
                            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
                        </button>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-slate-400 font-medium">
                    Please check your console/log if you are using a mock service.
                </p>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
