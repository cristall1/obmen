import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { BadgeCheck, Edit2, LogOut, Loader2, Store, Sparkles, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

const API_BASE = '';

// Avatar component with fallback to first letter
function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl'
  };

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size])}
      />
    );
  }

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center text-white font-bold",
      sizeClasses[size],
      colors[colorIndex]
    )}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

// Confetti effect
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            y: -20,
            x: Math.random() * window.innerWidth,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720,
            opacity: 0
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut'
          }}
          className={cn(
            "absolute w-3 h-3 rounded-sm",
            ['bg-yellow-400', 'bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'][i % 5]
          )}
        />
      ))}
    </div>
  );
}

// Star Rating Display
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );
}

type TabType = 'posts' | 'reviews';

export function Profile() {
  const { language, registration, role, setLanguage, logout, updateProfile, stats, fetchStats, setRole, myPosts, fetchMyPosts, removePost } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState(registration.name);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Seller verification
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerCode, setSellerCode] = useState('');
  const [sellerError, setSellerError] = useState('');
  const [isVerifyingSeller, setIsVerifyingSeller] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchMyPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [activeTab]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      // TODO: Get real user ID
      const res = await fetch(`${API_BASE}/api/users/1/reviews`);
      const data = await res.json();
      setReviews(data || []);
    } catch (e) {
      console.error('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenSellerModal = async () => {
    setShowSellerModal(true);
    setSellerCode('');
    setSellerError('');
    setIsRequestingCode(true);

    const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = tgUser?.id;

    if (telegramId) {
      try {
        await fetch(`${API_BASE}/api/auth/request-seller-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: telegramId })
        });
      } catch (e) {
        console.error('Failed to request seller code');
      }
    }
    setIsRequestingCode(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name: newName });
      setIsEditing(false);
    } catch (error) {
      alert('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBecomeSeller = async () => {
    setSellerError('');
    if (!sellerCode || sellerCode.length < 4) {
      setSellerError('Введите код');
      return;
    }

    setIsVerifyingSeller(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sellerCode.trim(), account_id: 1 })
      });
      const data = await res.json();

      if (data.error) {
        setSellerError('Неверный код');
        return;
      }

      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setShowSellerModal(false);
        setRole('exchanger');
      }, 2500);
    } catch (e) {
      setSellerError('Ошибка проверки');
    } finally {
      setIsVerifyingSeller(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Удалить этот пост?')) return;
    try {
      await removePost(postId);
      fetchMyPosts();
    } catch (e) {
      alert('Ошибка удаления');
    }
  };

  return (
    <>
      <Confetti show={showConfetti} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="space-y-5 pb-20"
      >
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <Avatar name={registration.name || 'User'} size="lg" />

          {isEditing ? (
            <div className="mt-3 w-full max-w-xs">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ваше имя"
                className="text-center"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 text-gray-600 text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Сохранить'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-bold text-gray-900">{registration.name || 'Пользователь'}</h2>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                {role === 'exchanger' ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Store size={14} />
                    Обменник
                  </span>
                ) : (
                  <span>Клиент</span>
                )}
                <BadgeCheck size={14} className="text-blue-500" />
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Edit2 size={12} />
                Редактировать
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <span className="block text-xl font-bold text-gray-900">{stats.active}</span>
            <span className="text-xs text-gray-500">Активных</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <span className="block text-xl font-bold text-gray-900">{stats.completed}</span>
            <span className="text-xs text-gray-500">Завершено</span>
          </div>
        </div>

        {/* Become Seller Button */}
        {role !== 'exchanger' && (
          <button
            onClick={handleOpenSellerModal}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            <Store size={18} />
            Стать обменником
          </button>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'posts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            )}
          >
            Мои посты
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'reviews' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            )}
          >
            Отзывы
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {myPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>У вас пока нет постов</p>
                </div>
              ) : (
                myPosts.map((post: any) => (
                  <div key={post.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2">{post.description || post.buy_description}</p>
                        <p className="text-xs text-gray-400 mt-1">{post.location}</p>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {loadingReviews ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-gray-400" size={24} />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Пока нет отзывов</p>
                </div>
              ) : (
                reviews.map((review: any) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={review.from_name || 'User'} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.from_name}</p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Language & Logout */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setLanguage('ru')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm',
                language === 'ru' ? 'bg-white shadow-sm' : ''
              )}
            >
              Русский
            </button>
            <button
              onClick={() => setLanguage('uz')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm',
                language === 'uz' ? 'bg-white shadow-sm' : ''
              )}
            >
              O'zbekcha
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 text-red-600 bg-red-50 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </motion.div>

      {/* Seller Modal */}
      <AnimatePresence>
        {showSellerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSellerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
                  {isRequestingCode ? (
                    <Loader2 className="text-white animate-spin" size={24} />
                  ) : (
                    <Sparkles className="text-white" size={24} />
                  )}
                </div>
                <h3 className="text-lg font-bold">Стать обменником</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isRequestingCode ? 'Отправляем код...' : 'Код отправлен в Telegram'}
                </p>
              </div>

              <Input
                value={sellerCode}
                onChange={(e) => setSellerCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXX"
                className="text-center text-lg tracking-wider py-3 mb-3"
              />

              {sellerError && (
                <p className="text-red-500 text-sm text-center mb-3">{sellerError}</p>
              )}

              <button
                onClick={handleBecomeSeller}
                disabled={isVerifyingSeller}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium"
              >
                {isVerifyingSeller ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Подтвердить'}
              </button>

              <button
                onClick={() => setShowSellerModal(false)}
                className="w-full py-2 mt-2 text-gray-500 text-sm"
              >
                Отмена
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
