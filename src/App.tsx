import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguagePage from './pages/LanguagePage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import AIAssistant from './pages/AIAssistant';
import ShoppingList from './pages/ShoppingList';
import MemberManagement from './pages/MemberManagement';
import Settings from './pages/Settings';
import Layout from './components/Layout';

export default function App() {
  const { user, language } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


  return (
    <Routes>
      <Route path="/language" element={<LanguagePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route 
        path="/" 
        element={user ? <Layout /> : <Navigate to="/language" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="add" element={<AddProduct />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="shopping-list" element={<ShoppingList />} />
        <Route path="members" element={<MemberManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/language" />} />
    </Routes>
  );
}
