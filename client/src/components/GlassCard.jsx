import React from 'react';

const GlassCard = ({ children, className = '' }) => {
    return (
        <div className={`bg-white/40 dark:bg-gray-900/50 backdrop-blur-xl border border-purple-500/10 dark:border-purple-500/20 shadow-lg dark:shadow-[0_0_15px_rgba(168,85,247,0.15)] rounded-2xl p-6 transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
};

export default GlassCard;
