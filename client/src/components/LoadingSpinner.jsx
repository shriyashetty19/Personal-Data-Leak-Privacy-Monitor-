import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const LoadingSpinner = ({ fullPage = false }) => {
    const content = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative"
            >
                <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 rounded-full"></div>
                <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400 relative z-10" />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse"
            >
                Securing your session...
            </motion.p>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-md flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
