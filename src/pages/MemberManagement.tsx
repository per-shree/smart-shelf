import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Member, Role } from '../types';
import { UserPlus, UserMinus, Shield, User, Loader2, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate, hashPassword } from '../lib/utils';

export default function MemberManagement() {
  const { fridge, user } = useAuth();
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fridge) return;
    const membersRef = collection(db, `fridges/${fridge.id}/members`);
    return onSnapshot(membersRef, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
    });
  }, [fridge]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridge || !newMemberName) return;
    setLoading(true);
    try {
      const membersRef = collection(db, `fridges/${fridge.id}/members`);
      await addDoc(membersRef, {
        username: newMemberName,
        email: newMemberEmail,
        role: Role.Member,
        joinedAt: new Date().toISOString(),
      });
      setNewMemberName('');
      setNewMemberEmail('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!fridge || !memberId || user?.role !== Role.Admin) return;
    if (!confirm(t('confirm_remove_member'))) return;
    
    try {
      const memberRef = doc(db, `fridges/${fridge.id}/members`, memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      console.error("Error removing member:", error);
      alert(t('failed_remove_member'));
    }
  };

  const handleUpdateMemberPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridge || !newMemberPassword || user?.role !== Role.Admin) return;
    setIsUpdatingPassword(true);
    try {
      const hashedPassword = await hashPassword(newMemberPassword);
      const fridgeRef = doc(db, 'fridges', fridge.id);
      await updateDoc(fridgeRef, {
        memberPasswordHash: hashedPassword
      });
      setNewMemberPassword('');
      alert(t('member_password_updated'));
    } catch (error) {
      console.error(error);
      alert(t('failed_update_password'));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const isAdmin = user?.role === Role.Admin;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold font-display text-[var(--color-text-main)]">{t('members_mgmt')}</h2>
        <p className="text-[var(--color-text-muted)] mt-1 font-medium italic">{t('manage_shared')}</p>
      </div>

      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-card-bg)] p-6 rounded-[2rem] border border-[var(--color-border-subtle)] shadow-xs"
        >
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <User className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
              <input
                type="text"
                placeholder={t('new_member_placeholder')}
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 border border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-background-base)] text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] text-sm font-medium shadow-xs placeholder:text-[var(--color-text-muted)]/50"
              />
            </div>
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
              <input
                type="email"
                placeholder={t('member_email_alerts')}
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 border border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-background-base)] text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] text-sm font-medium shadow-xs placeholder:text-[var(--color-text-muted)]/50"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              <span className="uppercase tracking-widest text-[10px] font-black">{t('add')}</span>
            </button>
          </form>
        </motion.div>
      )}

      {/* Shelf Access Credentials Section */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-card-bg)] p-8 rounded-[2.5rem] border border-[var(--color-primary)]/10 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg text-[var(--color-primary)]">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-main)] font-display">{t('shelf_access_settings')}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{t('define_access')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shelf ID (Admin Username) */}
            <div className="p-5 bg-[var(--color-background-base)] rounded-2xl border border-[var(--color-border-subtle)]/50 space-y-2">
              <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{t('admin_username')}</p>
              <div className="flex items-center justify-between">
                <code className="text-sm font-bold text-[var(--color-primary)]">{fridge?.adminUsername}</code>
                <p className="text-[9px] text-[var(--color-text-muted)] italic">{t('members_use_this')}</p>
              </div>
            </div>

            {/* Set Member Password */}
            <form onSubmit={handleUpdateMemberPassword} className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{t('member_password')}</p>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                  <input
                    type="password"
                    placeholder={t('set_member_password')}
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-background-base)] text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] text-sm font-medium"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isUpdatingPassword || !newMemberPassword}
                className="w-full py-3 bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[#5A5A40]/20"
              >
                {isUpdatingPassword ? t('updating') : t('update_member_password')}
              </button>
            </form>
          </div>

          <p className="text-[10px] text-[var(--color-text-muted)] text-center leading-relaxed">
            <span className="font-bold text-[var(--color-primary)]">Note:</span> {t('note_members_need')}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map((m) => (
          <div 
            key={m.id}
            className="p-6 bg-[var(--color-card-bg)] rounded-3xl border border-[var(--color-border-subtle)] shadow-xs flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs",
                m.role === Role.Admin ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-background-base)] text-[var(--color-text-muted)]"
              )}>
                {m.role === Role.Admin ? <Shield size={24} /> : <User size={24} />}
              </div>
              <div>
                <p className="font-bold text-[var(--color-text-main)] text-sm">{m.username}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full font-black uppercase tracking-widest",
                    m.role === Role.Admin ? "bg-[#FFF3E0] dark:bg-[#402000] text-[#E65100] dark:text-[#FFCC80]" : "bg-[var(--color-background-base)] text-[var(--color-text-muted)]"
                  )}>
                    {m.role === Role.Admin ? t('admin') : t('member')}
                  </span>
                  <span className="text-[var(--color-text-muted)] font-bold italic opacity-60">{t('joined')} {formatDate(m.joinedAt)}</span>
                </div>
                {m.email && <p className="text-[9px] text-[var(--color-primary)] mt-1 font-bold">{m.email}</p>}
              </div>
            </div>
            {isAdmin && m.username !== user?.username && (
              <button 
                onClick={() => handleRemoveMember(m.id)}
                className="p-2.5 text-[var(--color-border-subtle)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <UserMinus size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
