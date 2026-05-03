import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const words = ['Track', 'Manage', 'Grow'];

const Loader = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--color-background-base)]">
      <div className="relative flex flex-col items-center">
        {/* Center Logo - Breathable */}
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            filter: [
              'drop-shadow(0 0 0px var(--color-primary))',
              'drop-shadow(0 0 20px var(--color-primary))',
              'drop-shadow(0 0 0px var(--color-primary))'
            ]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-32 h-32 flex items-center justify-center overflow-hidden"
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain" 
          />
        </motion.div>
      </div>

      <div className="mt-12 h-8 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-[var(--color-primary)] font-black uppercase tracking-[0.4em] text-sm"
          >
            {words[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex gap-1.5 justify-center"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-[var(--color-primary)]/40 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
};

export default Loader;
