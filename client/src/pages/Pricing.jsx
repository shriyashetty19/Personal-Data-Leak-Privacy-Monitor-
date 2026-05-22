import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Globe, Database, User, Star } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Pricing = () => {
    const handleSubscription = async (planId) => {
        try {
            if (planId === 'free') {
                toast.success('You are already on the Free plan!');
                return;
            }
            
            const response = await axios.post('/api/subscription/create-checkout-session', { planId });
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error initiating checkout');
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Basic Protection',
            price: '0',
            icon: User,
            description: 'Essential monitoring for individuals.',
            features: [
                '1 Monitored Email',
                'Basic Leak Alerts',
                'Community Support',
                'Public Breach Database Access'
            ],
            cta: 'Current Plan',
            popular: false
        },
        {
            id: 'pro',
            name: 'Pro Sentinel',
            price: '19',
            icon: Shield,
            description: 'Advanced protection with real-time defense.',
            features: [
                '10 Monitored Emails',
                'Real-time Dark Web Alerts',
                'Priority Email Support',
                'Domain Health Reports',
                'Exposure Risk Analysis'
            ],
            cta: 'Upgrade to Pro',
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise Guardian',
            price: '49',
            icon: Globe,
            description: 'Complete security for teams & businesses.',
            features: [
                'Unlimited Assets',
                'Organization Management',
                'API Access',
                'Dedicated Support Agent',
                'White-label Reports',
                'Audit Logs'
            ],
            cta: 'Go Enterprise',
            popular: false
        }
    ];

    return (
        <div className="pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-20">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-6"
                    >
                        Simple, <span className="text-purple-500">Transparent</span> Pricing
                    </motion.h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Choose the level of protection that fits your needs. No hidden fees, cancel anytime.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative p-8 rounded-[2.5rem] bg-white/5 border ${plan.popular ? 'border-purple-500/50' : 'border-white/10'} backdrop-blur-xl flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-500/20">
                                    <Star className="w-3.5 h-3.5 fill-white" /> Most Popular
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.popular ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                                    <plan.icon className={`w-7 h-7 ${plan.popular ? 'text-purple-400' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="text-5xl font-bold text-white">${plan.price}</span>
                                <span className="text-slate-400">/month</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscription(plan.id)}
                                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                                    plan.popular 
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20' 
                                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                }`}
                            >
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
                    <h3 className="text-xl font-bold text-white mb-4">Need something custom for your enterprise?</h3>
                    <p className="text-slate-400 mb-6 max-w-2xl mx-auto text-sm">
                        For organizations with over 100 employees, we offer custom deployment, SSO integration, and dedicated security consultants.
                    </p>
                    <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
