import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LogOut, Search, LayoutDashboard, Activity, Lock, Users } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    const navLinks = user ? [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: Activity },
        { name: 'Team', path: '/organization', icon: Users },
        { name: 'Security', path: '/security', icon: Lock },
        { name: 'Pricing', path: '/pricing', icon: Shield }
    ] : [
        { name: 'Pricing', path: '/pricing', icon: Shield }
    ];

    if (isAuthPage) return null; // Hide on auth pages for focus

    return (
        <nav className="sticky top-0 z-50 px-4 py-4 pointer-events-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center"
                >
                    <Link to="/" className="flex items-center gap-3 group glass-morphism px-4 py-2 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800 shadow-xl">
                        <div className="p-1.5 bg-purple-600 rounded-lg shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-slate-900 dark:text-white font-black text-lg tracking-tight hidden sm:block">
                            PrivacyMonitor
                        </span>
                    </Link>
                </motion.div>
                
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 glass-morphism p-2 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800 shadow-xl"
                >
                    <div className="flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link 
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    location.pathname === link.path 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <link.icon size={16} />
                                <span className="hidden md:block">{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {user && (
                            <button 
                                onClick={logout}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                        {!user && (
                             <Link to="/login" className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform">
                                Sign In
                             </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        </nav>
    );
};

export default Navbar;
