import { Plus } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';

export function Header() {
  const { language, role, activeTab, setShowAddPostModal, registration } = useStore();

  // Don't show role button during registration
  const isRegistered = registration.completed === true;
  const showAddButton = role === 'exchanger' && activeTab === 'feed' && isRegistered;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex justify-between items-center px-4 py-4 max-w-md mx-auto">
        <div className="flex-1" />

        <h1 className="text-title font-bold text-gray-900">{t('appName', language)}</h1>

        <div className="flex-1 flex justify-end">
          {showAddButton && (
            <button
              onClick={() => setShowAddPostModal(true)}
              className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-md"
              aria-label="Add post"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
