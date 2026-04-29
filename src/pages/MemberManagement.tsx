import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Member, Role } from '../types';
import { UserPlus, UserMinus, Shield, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export default function MemberManagement() {
  const { fridge, user } = useAuth();
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
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
        role: Role.Member,
        joinedAt: new Date().toISOString(),
      });
      setNewMemberName('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!fridge || user?.role !== Role.Admin) return;
    const memberRef = doc(db, `fridges/${fridge.id}/members`, id);
    await deleteDoc(memberRef);
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
          className="bg-white p-6 rounded-[2rem] border border-[var(--color-border-subtle)] shadow-xs"
        >
          <form onSubmit={handleAddMember} className="flex gap-4">
            <div className="relative flex-1">
              <User className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
              <input
                type="text"
                placeholder={t('new_member_placeholder')}
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 border border-[var(--color-border-subtle)] rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] text-sm font-medium shadow-xs"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              <span className="uppercase tracking-widest text-[10px] font-black">{t('add')}</span>
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map((m) => (
          <div 
            key={m.id}
            className="p-6 bg-white rounded-3xl border border-[var(--color-border-subtle)] shadow-xs flex items-center justify-between group hover:shadow-md transition-all"
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
                    m.role === Role.Admin ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[var(--color-background-base)] text-[var(--color-text-muted)]"
                  )}>
                    {m.role === Role.Admin ? t('admin') : t('member')}
                  </span>
                  <span className="text-[var(--color-text-muted)] font-bold italic opacity-60">{t('joined')} {formatDate(m.joinedAt)}</span>
                </div>
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
