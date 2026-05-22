import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Copy, CheckCircle, Smartphone, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const MfaSetup = () => {
    const [step, setStep] = useState(1);
    const [qrData, setQrData] = useState(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchMfaSetup = async () => {
        try {
            const res = await axios.post('/api/auth/setup-2fa');
            setQrData(res.data);
        } catch (error) {
            toast.error('Failed to initiate MFA setup');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/auth/verify-2fa', { token });
            toast.success('Two-Factor Authentication Enabled!');
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-xl">
                <Link to="/security" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Security
                </Link>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Secure Your Account</h1>
                            <p className="text-slate-400">Step {step} of 2</p>
                        </div>
                    </div>

                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3 text-white font-semibold mb-3">
                                        <Smartphone className="w-5 h-5 text-purple-400" />
                                        1. Install Authenticator
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Download Google Authenticator or Microsoft Authenticator from the App Store or Play Store.
                                    </p>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={() => {
                                            fetchMfaSetup();
                                            setStep(2);
                                        }}
                                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-600/20"
                                    >
                                        I have the app, show QR Code
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="text-center mb-8">
                                <p className="text-slate-300 mb-6 text-sm">
                                    Scan this QR code with your authenticator app:
                                </p>
                                <div className="p-4 bg-white rounded-2xl inline-block mb-6 shadow-2xl">
                                    {qrData ? (
                                        <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48" />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {qrData && (
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs text-slate-500 font-mono">CAN'T SCAN? USE THIS SECRET:</span>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                            <span className="text-purple-400 font-mono text-sm">{qrData.secret}</span>
                                            <button onClick={() => {
                                                navigator.clipboard.writeText(qrData.secret);
                                                toast.success('Secret copied');
                                            }} className="text-slate-500 hover:text-white transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2 text-center">Enter 6-digit code from app</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="000 000"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-center text-2xl tracking-[0.5em] focus:border-purple-500 outline-none transition-all font-mono"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || token.length !== 6}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Verifying...' : 'Enable 2FA'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">You're All Set!</h2>
                            <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                                Two-factor authentication is now active. Your account is protected by an additional layer of security.
                            </p>
                            <button
                                onClick={() => navigate('/security')}
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Done
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MfaSetup;
