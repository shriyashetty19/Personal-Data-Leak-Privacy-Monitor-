import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Zap, CheckCircle, ArrowRight, ShieldCheck, Globe, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="relative pt-20 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="container mx-auto px-6 text-center py-20 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6 inline-block">
                        Enterprise-Grade Identity Protection
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
                        Your Identity is Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Most Valuable Asset.</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        DataLeak Monitor provides real-time monitoring of the dark web, public databases, and underground forums to ensure your personal data stays yours.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/signup" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 group shadow-lg shadow-purple-600/20">
                            Start Free Protection <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/pricing" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all">
                            View Pricing
                        </Link>
                    </div>
                </motion.div>

                {/* Dashboard Preview Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-20 relative max-w-5xl mx-auto"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden aspect-video">
                        <div className="absolute top-0 inset-x-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="p-8 pt-12 flex flex-col items-center justify-center h-full text-slate-500 italic">
                             [Interactive Dashboard Preview - Real UI Implementation Below]
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-black/20 backdrop-blur-sm relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Protecting Every Digital Footprint</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Our advanced scanners cover the entire surface of the web to detect potential exposures before they become threats.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: "Dark Web Monitoring", desc: "We scan underground forums and marketplaces for your stolen credentials." },
                            { icon: Lock, title: "Identity Vault", desc: "Securely manage and monitor your sensitive information with multi-layer encryption." },
                            { icon: Zap, title: "Real-time Alerts", desc: "Instant notifications via Email, SMS, and Push the moment a leak is detected." },
                            { icon: Globe, title: "Global Breach Coverage", desc: "Monitoring over 15 billion compromised records from thousands of breaches." },
                            { icon: Eye, title: "Exposure Analysis", desc: "Deep analysis of how your data was leaked and actionable remediation steps." },
                            { icon: Database, title: "Organization Privacy", desc: "Protect your entire team with centralized management and domain monitoring." }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            <section className="py-20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Ready to Secure Your Future?</h2>
                    <div className="inline-flex flex-col items-center p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl mb-12">
                        <div className="p-8 text-left max-w-md">
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-bold">PRO PLAN</span>
                                <span className="text-white font-bold text-2xl">$19<span className="text-slate-400 text-sm font-normal">/mo</span></span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {['Monitor up to 10 assets', 'Full Dark Web Scan', '24/7 Real-time Monitoring', 'Priority Support', 'Domain Monitoring'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle className="w-5 h-5 text-green-500" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/signup" className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-xl font-semibold transition-all">
                                Get Started Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-white/10 overflow-hidden relative text-center">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"></div>
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Join the 50,000+ Users <br /> Protecting Their Identity</h2>
                        <Link to="/signup" className="px-10 py-5 bg-white text-black hover:bg-slate-200 rounded-2xl font-bold text-lg transition-all shadow-xl">
                            Create Your Free Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
