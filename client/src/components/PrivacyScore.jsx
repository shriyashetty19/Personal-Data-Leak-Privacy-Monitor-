import { motion } from 'framer-motion';

const PrivacyScore = ({ score }) => {
    const getColor = (s) => {
        if (s >= 80) return '#22c55e'; // Green
        if (s >= 50) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    };

    const color = getColor(score);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-800"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    fill="transparent"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-5xl font-bold text-slate-900 dark:text-white"
                >
                    {score}
                </motion.span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Score</span>
            </div>
            
            {/* Ambient Glow */}
            <div 
                className="absolute inset-0 blur-3xl opacity-20 rounded-full"
                style={{ backgroundColor: color }}
            ></div>
        </div>
    );
};

export default PrivacyScore;
