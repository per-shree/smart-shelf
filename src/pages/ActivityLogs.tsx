import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, User, Info, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export default function ActivityLogs() {
  const { fridge } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fridge) return;

    const logsPath = `fridges/${fridge.id}/activity_logs`;
    const logsRef = collection(db, logsPath);
    const q = query(logsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setLogs(logsList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, logsPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fridge]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--color-text-main)]">Activity Logs</h2>
          <p className="text-sm text-[var(--color-text-muted)] font-medium">Monitor all actions within your household</p>
        </div>
      </div>

      <div className="bg-[var(--color-card-bg)] rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-muted)] flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <p className="text-sm font-bold uppercase tracking-widest">Loading logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background-base)] text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="px-8 py-5 font-black">Date & Time</th>
                  <th className="px-8 py-5 font-black">User</th>
                  <th className="px-8 py-5 font-black">Action</th>
                  <th className="px-8 py-5 font-black">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]/50 text-sm">
                <AnimatePresence>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center">
                        <AlertCircle size={48} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-50" />
                        <p className="text-[var(--color-text-muted)] text-lg font-medium">No activities recorded yet.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-[var(--color-background-base)] transition-colors"
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[var(--color-text-muted)]" />
                            <div>
                              <p className="font-bold text-[var(--color-text-main)]">
                                {formatDate(log.timestamp)}
                              </p>
                              <p className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-80">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs uppercase">
                              {log.user.slice(0, 2)}
                            </div>
                            <span className="font-bold text-[var(--color-text-main)]">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm">
                            <Info size={16} className="shrink-0" />
                            <span>{log.details}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
