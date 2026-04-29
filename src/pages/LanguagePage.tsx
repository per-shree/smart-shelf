import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi / हिंदी' },
  { code: 'mr', name: 'Marathi / मराठी' },
];

export default function LanguagePage() {
  const { setLanguage } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelect = (code: string) => {
    setLanguage(code);
    localStorage.setItem('lang', code);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-base)] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-10 rounded-3xl shadow-xl text-center"
      >
        <div className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#5A5A40]/10">
          <Languages size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-10 font-display text-[var(--color-text-main)]">{t('language_selection')}</h1>
        <div className="space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full py-5 px-8 text-left rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] hover:border-[var(--color-primary)] hover:bg-[var(--color-background-base)] transition-all font-bold text-[var(--color-text-main)] flex justify-between items-center group shadow-xs"

            >
              <span>{lang.name}</span>
              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border-subtle)] group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)] transition-all" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
