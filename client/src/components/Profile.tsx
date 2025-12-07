import React, { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { BadgeCheck, Edit2, LogOut, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

export function Profile() {
  const { language, registration, role, setLanguage, logout, updateProfile, stats, fetchStats } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState(registration.name);
  const [newPhone, setNewPhone] = useState(registration.phone);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name: newName, phone: newPhone });
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="space-y-6 pb-20"
    >
      <div>
        {/* Brand Name */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            {t('appName', language)}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Role indicator */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-caption text-gray-500 uppercase tracking-wide mb-3 font-medium">
              {t('role', language)}
            </p>
            <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-900 font-medium">
                {(role || 'client') === 'client' ? t('role_client', language) : t('role_exchanger', language)}
              </span>
              <span className="text-caption text-gray-500">
                {t('changeRoleInProfile', language) || 'Смена роли доступна через поддержку'}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="pb-6 border-b border-gray-200">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                />
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-body font-medium text-gray-900">{registration.name || 'Азат М.'}</p>
                  <BadgeCheck size={16} className="text-blue-500" />
                </div>
                <p className="text-caption text-gray-500">
                  {registration.phone || '+998 90 123-45-67'}
                </p>
              </>
            )}
          </div>

          {/* Language Selector */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-caption text-gray-500 uppercase tracking-wide mb-3 font-medium">
              {t('language', language)}
            </p>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setLanguage('ru')}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-body font-medium transition-all shadow-sm',
                  language === 'ru'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shadow-none'
                )}
              >
                Русский
              </button>
              <button
                onClick={() => setLanguage('uz')}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-body font-medium transition-all shadow-sm',
                  language === 'uz'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shadow-none'
                )}
              >
                O'zbekcha
              </button>
            </div>
          </div>

          {/* Verification */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-caption text-gray-500 uppercase tracking-wide mb-3 font-medium">
              {t('verification', language)}
            </p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <p className="text-body text-gray-900">{t('phoneNumber', language)}</p>
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <BadgeCheck size={14} />
                <span className="text-caption font-medium">Verified</span>
              </div>
            </div>
          </div>

          {/* Stats - Real Data */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-caption text-gray-500 uppercase tracking-wide mb-3 font-medium">
              {t('statuses', language)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="block text-caption text-gray-500 mb-1">{t('activeRequests', language)}</span>
                <span className="block text-xl font-semibold text-gray-900">{stats.active}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="block text-caption text-gray-500 mb-1">{t('completedDeals', language)}</span>
                <span className="block text-xl font-semibold text-gray-900">{stats.completed}</span>
              </div>
            </div>
          </div>

          {/* Edit Contacts */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-caption text-gray-500 uppercase tracking-wide mb-3 font-medium">
              {t('contacts', language)}
            </p>
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className={cn(
                "w-full py-3 text-body border rounded-xl transition-colors flex items-center justify-center gap-2 font-medium",
                isEditing
                  ? "bg-black text-white border-black hover:bg-gray-900"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              )}
            >
              {isEditing ? (
                <>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              ) : (
                <>
                  <Edit2 size={18} />
                  {t('edit', language)}
                </>
              )}
            </button>
          </div>

          {/* Logout */}
          <div>
            <button
              onClick={logout}
              className="w-full py-3 text-body text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <LogOut size={18} />
              {t('logout', language) || 'Выйти'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
