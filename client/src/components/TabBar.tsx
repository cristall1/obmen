import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Newspaper, FilePlus, BadgeDollarSign, User, Plus } from 'lucide-react';
import type { TabKey } from '@/types';
import type { LucideIcon } from 'lucide-react';



export function TabBar() {
  const { activeTab, setActiveTab, language, role, setShowAddPostModal } = useStore();

  const clientTabs: { key: TabKey; icon: LucideIcon; labelKey: string }[] = [
    { key: 'feed', icon: Newspaper, labelKey: 'tabFeed' },
    { key: 'create', icon: FilePlus, labelKey: 'tabCreate' },
    { key: 'offers', icon: BadgeDollarSign, labelKey: 'tabOffers' },
    { key: 'profile', icon: User, labelKey: 'tabProfile' }
  ];

  const exchangerTabs: { key: TabKey | 'add_post'; icon: LucideIcon; labelKey: string }[] = [
    { key: 'feed', icon: Newspaper, labelKey: 'tabFeed' },
    { key: 'create', icon: FilePlus, labelKey: 'tabCreate' },
    { key: 'add_post', icon: Plus, labelKey: 'addPost' }, // Middle button
    { key: 'offers', icon: BadgeDollarSign, labelKey: 'tabOffers' },
    { key: 'profile', icon: User, labelKey: 'tabProfile' }
  ];

  const currentTabs = role === 'exchanger' ? exchangerTabs : clientTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {currentTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isAddPost = tab.key === 'add_post';

          if (isAddPost) {
            return (
              <button
                key="add_post"
                onClick={() => setShowAddPostModal(true)}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg shadow-black/20 active:scale-95 transition-transform">
                  <Icon size={28} className="text-white" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              aria-label={t(tab.labelKey, language)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-gray-900" : "text-gray-400")}>
                {t(tab.labelKey, language)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
