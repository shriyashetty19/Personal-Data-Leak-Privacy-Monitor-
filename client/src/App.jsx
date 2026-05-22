import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import LeakChecker from './pages/LeakChecker';
import ParticlesBackground from './components/ParticlesBackground';
import PageWrapper from './components/PageWrapper';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]"><div className="w-8 h-8 focus:outline-none border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

import SecurityCenter from './pages/SecurityCenter';
import Analytics from './pages/Analytics';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import MfaSetup from './pages/MfaSetup';
import OrganizationSettings from './pages/OrganizationSettings';

const SubscriptionSuccess = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 rounded-[2.5rem] text-center max-w-md">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Subscription Active!</h1>
            <p className="text-slate-400 mb-10">Welcome to the Pro family. Your advanced protection is now active.</p>
            <Link to="/dashboard" className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold">Go to Dashboard</Link>
        </div>
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
                <Route path="/verify" element={<PageWrapper><VerifyEmail /></PageWrapper>} />
                <Route 
                    path="/mfa/setup" 
                    element={
                        <ProtectedRoute>
                            <PageWrapper><MfaSetup /></PageWrapper>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/organization" 
                    element={
                        <ProtectedRoute>
                            <PageWrapper><OrganizationSettings /></PageWrapper>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <PageWrapper><Dashboard /></PageWrapper>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/check" 
                    element={
                        <ProtectedRoute>
                            <PageWrapper><LeakChecker /></PageWrapper>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/security" 
                    element={
                        <ProtectedRoute>
                            <PageWrapper><SecurityCenter /></PageWrapper>
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/analytics" 
                    element={
                        <ProtectedRoute>
                            <PageWrapper><Analytics /></PageWrapper>
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </AnimatePresence>
    );
};

const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="mesh-gradient"></div>
        <ParticlesBackground />
        <Navbar />
        <main className="flex-grow z-10">
          <AnimatedRoutes />
        </main>
        <Toaster 
            position="bottom-right"
            toastOptions={{
                className: 'glass-morphism dark:text-white border border-purple-500/20',
                style: {
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                },
            }}
        />
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
