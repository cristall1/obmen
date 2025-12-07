import { useStore } from '@/hooks/useStore';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { Registration } from './Registration';
import { Login } from './Login';
import { Feed } from './Feed';
import { CreateRequest } from './CreateRequest';
import { Offers } from './Offers';
import { Profile } from './Profile';
import { ExchangerInbox } from './ExchangerInbox';
import { TelegramHandoff } from './TelegramHandoff';
import { PostDetails } from './PostDetails';
import { Onboarding } from './Onboarding';
import { AddPostSheet } from './AddPostSheet';
import { EditPostSheet } from './EditPostSheet';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Loading } from './Loading';

export function AppShell() {
  const { activeTab, registration, role, onboardingSeen, loginMode, setTelegramUser, fetchMarketPosts } = useStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 1000);
    useStore.getState().fetchConfig();
    // Telegram init
    try {
      const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser) {
        setTelegramUser({
          id: tgUser.id,
          username: tgUser.username ? `@${tgUser.username}` : undefined,
          name: tgUser.first_name
        });
      }
    } catch (e) {
      console.warn('Telegram init data not available', e);
    }
    fetchMarketPosts();
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  // Check if user fully completed registration (clicked "Continue" button)
  const isRegistered = registration.completed === true;

  // Show onboarding first
  if (!onboardingSeen) {
    return <Onboarding />;
  }

  // Show login if user clicked "already have account"
  if (loginMode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="min-h-screen bg-white"
        >
          <Header />
          <div className="max-w-md mx-auto pt-20 pb-20 px-4 sm:px-6">
            <Login />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Then show registration
  if (!isRegistered) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="registration"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="min-h-screen bg-white"
        >
          <Header />
          <div className="max-w-md mx-auto pt-20 pb-20 px-4 sm:px-6">
            <Registration />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Finally show main app
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-md mx-auto pt-20 pb-24 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && <Feed key="feed" />}
          {activeTab === 'create' && <CreateRequest key="create" />}
          {activeTab === 'offers' && (
            role === 'exchanger' ? <ExchangerInbox key="exchanger" /> : <Offers key="offers" />
          )}
          {activeTab === 'profile' && <Profile key="profile" />}
        </AnimatePresence>
      </div>
      <TabBar />
      <TelegramHandoff />
      <PostDetails />
      <AddPostSheet />
      <EditPostSheet />
    </div>
  );
}
