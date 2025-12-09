import { useStore } from '@/hooks/useStore';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { Registration } from './Registration';
import { Login } from './Login';
import { Feed } from './Feed';
import { CreateRequest } from './CreateRequest';
import { Offers } from './Offers';
import { Profile } from './Profile';
import { Onboarding } from './Onboarding';
import { AddPostSheet } from './AddPostSheet';
import { PostPage } from './PostPage';
import { UserPage } from './UserPage';
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

export function AppShell() {
  const { activeTab, registration, onboardingSeen, loginMode, hasAccount, setTelegramUser, fetchMarketPosts } = useStore();
  const location = useLocation();

  React.useEffect(() => {
    // Non-blocking - all async
    useStore.getState().fetchConfig();
    fetchMarketPosts();

    // Get Telegram user data
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
      // Silent fail
    }
  }, []);

  // No loading screen - instant

  const isRegistered = registration.completed === true || registration.verified === true || hasAccount;

  // Check localStorage directly for faster skip (handle null properly)
  const storageData = localStorage.getItem('obmen-storage') || '';
  const hasSeenOnboarding = onboardingSeen || storageData.includes('"onboardingSeen":true');
  // Use state first, then fallback to localStorage
  const hasRegistration = isRegistered || storageData.includes('"completed":true') || storageData.includes('"verified":true');

  // Show onboarding first (only if truly not seen)
  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  // Show login
  if (loginMode) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-md mx-auto pt-14 pb-20 px-4">
          <Login />
        </div>
      </div>
    );
  }

  // Show registration
  if (!hasRegistration) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-md mx-auto pt-14 pb-20 px-4">
          <Registration />
        </div>
      </div>
    );
  }

  // Check if we're on a sub-page (post or user)
  const isSubPage = location.pathname.startsWith('/post/') || location.pathname.startsWith('/user/');

  // Main app with routing
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-md mx-auto pt-14 pb-24 px-4">
        <Routes>
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route path="*" element={
            <AnimatePresence mode="wait">
              {activeTab === 'feed' && <Feed key="feed" />}
              {activeTab === 'create' && <CreateRequest key="create" />}
              {activeTab === 'offers' && <Offers key="offers" />}
              {activeTab === 'profile' && <Profile key="profile" />}
            </AnimatePresence>
          } />
        </Routes>
      </div>
      {!isSubPage && <TabBar />}
      <AddPostSheet />
    </div>
  );
}
