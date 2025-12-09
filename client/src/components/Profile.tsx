import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/hooks/useStore';
import { BadgeCheck, Edit2, LogOut, Loader2, Store, Sparkles, Star, Trash2, Send, CheckCircle, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

const API_BASE = '';

// Avatar component with edit capability
function Avatar({
  name,
  avatarUrl,
  size = 'lg',
  editable = false,
  onAvatarChange
}: {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onAvatarChange?: (data: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-16 h-16 text-xl', lg: 'w-24 h-24 text-3xl' };
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAvatarChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAvatarChange) {
      onAvatarChange(null);
    }
  };

  const avatarContent = avatarUrl ? (
    <img src={avatarUrl} alt={name} className={cn("rounded-full object-cover w-full h-full")} />
  ) : (
    <div className={cn("rounded-full flex items-center justify-center text-white font-bold w-full h-full", colors[colorIndex])}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );

  if (editable) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className={cn("relative cursor-pointer overflow-hidden", sizeClasses[size])}
        >
          {avatarContent}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
            <Camera size={24} className="text-white" />
          </div>
        </motion.div>
        {avatarUrl && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  return <div className={sizeClasses[size]}>{avatarContent}</div>;
}

// Confetti Animation
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * window.innerWidth, rotate: 0, opacity: 1 }}
          animate={{ y: window.innerHeight + 20, rotate: Math.random() * 720, opacity: 0 }}
          transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'easeOut' }}
          className={cn("absolute w-3 h-3 rounded-sm", ['bg-yellow-400', 'bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'][i % 5])}
        />
      ))}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={14} className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  );
}

type TabType = 'posts' | 'reviews';

export function Profile() {
  const { language, registration, role, setLanguage, logout, updateProfile, stats, fetchStats, setRole, myPosts, fetchMyPosts, removePost, setRegistration } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState(registration.name);
  const [newAvatar, setNewAvatar] = useState<string | undefined>(registration.avatarUrl);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Seller verification
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerCode, setSellerCode] = useState('');
  const [sellerError, setSellerError] = useState('');
  const [isVerifyingSeller, setIsVerifyingSeller] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Avatar prompt for first-time users
  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchMyPosts();

    // Show avatar prompt if no avatar and profile just opened
    if (!registration.avatarUrl && registration.completed) {
      const hasSeenPrompt = localStorage.getItem('avatar_prompt_seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowAvatarPrompt(true), 500);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews();
  }, [activeTab]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/1/reviews`);
      const data = await res.json();
      setReviews(data || []);
    } catch (e) {
      console.error('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleRequestSellerCode = async () => {
    setIsRequestingCode(true);
    setSellerError('');

    // Try to get telegram_id from WebApp first, then from registration data
    const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = tgUser?.id || registration.telegramId;

    if (!telegramId) {
      setSellerError('Telegram ID не найден. Перезайдите в аккаунт.');
      setIsRequestingCode(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/request-seller-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId })
      });
      const data = await res.json();

      if (data.error) {
        setSellerError('Ошибка отправки. Попробуйте снова.');
      } else {
        setCodeSent(true);
      }
    } catch (e) {
      setSellerError('Ошибка сети');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleOpenSellerModal = () => {
    setShowSellerModal(true);
    setSellerCode('');
    setSellerError('');
    setCodeSent(false);
  };

  const handleBecomeSeller = async () => {
    setSellerError('');
    if (!sellerCode || sellerCode.length < 4) {
      setSellerError('Введите код');
      return;
    }

    // Try to get telegram_id from WebApp first, then from registration data
    const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = tgUser?.id || registration.telegramId;

    if (!telegramId) {
      setSellerError('Telegram ID не найден. Перезайдите в аккаунт.');
      return;
    }

    setIsVerifyingSeller(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sellerCode.trim(), telegram_id: telegramId })
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

  const handleAvatarChange = (data: string | null) => {
    setNewAvatar(data || undefined);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update name
      await updateProfile({ name: newName });

      // Update avatar on server if account_id exists
      if (registration.accountId && newAvatar !== registration.avatarUrl) {
        await fetch(`${API_BASE}/api/user/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: registration.accountId,
            avatar_url: newAvatar || null
          })
        });
      }

      // Update local state
      setRegistration({
        ...registration,
        name: newName,
        avatarUrl: newAvatar
      });

      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save profile:', e);
      alert('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismissAvatarPrompt = (addLater: boolean) => {
    setShowAvatarPrompt(false);
    if (addLater) {
      localStorage.setItem('avatar_prompt_seen', 'true');
    } else {
      setIsEditing(true);
      localStorage.setItem('avatar_prompt_seen', 'true');
    }
  };

  return (
    <>
      <Confetti show={showConfetti} />

      {/* Avatar Prompt Modal */}
      <AnimatePresence>
        {showAvatarPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Добавить фото?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Добавьте фото профиля чтобы другие пользователи узнавали вас
              </p>
              <button
                onClick={() => handleDismissAvatarPrompt(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium mb-2"
              >
                Добавить фото
              </button>
              <button
                onClick={() => handleDismissAvatarPrompt(true)}
                className="w-full py-2 text-gray-500 text-sm"
              >
                Позже
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="space-y-5 pb-20"
      >
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <Avatar
            name={registration.name || 'User'}
            avatarUrl={isEditing ? newAvatar : registration.avatarUrl}
            size="lg"
            editable={isEditing}
            onAvatarChange={handleAvatarChange}
          />

          {isEditing ? (
            <div className="mt-3 w-full max-w-xs">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ваше имя" className="text-center" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setIsEditing(false); setNewAvatar(registration.avatarUrl); }} className="flex-1 py-2 text-gray-600 text-sm">Отмена</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm">
                  {isSaving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Сохранить'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-bold text-gray-900">{registration.name || 'Пользователь'}</h2>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                {role === 'exchanger' ? (
                  <span className="flex items-center gap-1 text-green-600"><Store size={14} />Обменник</span>
                ) : (
                  <span>Клиент</span>
                )}
                <BadgeCheck size={14} className="text-blue-500" />
              </div>
              <button onClick={() => setIsEditing(true)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <Edit2 size={12} />Редактировать
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

        {/* Become Seller */}
        {role !== 'exchanger' && (
          <button
            onClick={handleOpenSellerModal}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Store size={18} />
            Стать обменником
          </button>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => setActiveTab('posts')} className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-all', activeTab === 'posts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>Мои посты</button>
          <button onClick={() => setActiveTab('reviews')} className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-all', activeTab === 'reviews' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>Отзывы</button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {myPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-400"><p>У вас пока нет постов</p></div>
              ) : (
                myPosts.map((post: any) => (
                  <div key={post.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2">{post.description || post.buy_description}</p>
                        <p className="text-xs text-gray-400 mt-1">{post.location}</p>
                      </div>
                      <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {loadingReviews ? (
                <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-gray-400" size={24} /></div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400"><p>Пока нет отзывов</p></div>
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
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Language & Logout */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setLanguage('ru')} className={cn('flex-1 py-2 rounded-lg text-sm', language === 'ru' ? 'bg-white shadow-sm' : '')}>Русский</button>
            <button onClick={() => setLanguage('uz')} className={cn('flex-1 py-2 rounded-lg text-sm', language === 'uz' ? 'bg-white shadow-sm' : '')}>O'zbekcha</button>
          </div>
          <button onClick={logout} className="w-full py-3 text-red-600 bg-red-50 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={18} />Выйти
          </button>
        </div>
      </motion.div>

      {/* Seller Modal */}
      <AnimatePresence>
        {showSellerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSellerModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-bold">Стать обменником</h3>
                <p className="text-sm text-gray-500 mt-1">Получите код подтверждения в Telegram</p>
              </div>

              {!codeSent && (
                <button
                  onClick={handleRequestSellerCode}
                  disabled={isRequestingCode}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 mb-4 transition-colors"
                >
                  {isRequestingCode ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Send size={18} />
                      Отправить код
                    </>
                  )}
                </button>
              )}

              {codeSent && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl mb-4">
                  <CheckCircle size={18} />
                  <span className="text-sm">Код отправлен в Telegram!</span>
                </div>
              )}

              <Input
                value={sellerCode}
                onChange={(e) => setSellerCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXX"
                className="text-center text-lg tracking-wider py-3 mb-3"
              />

              {sellerError && (
                <p className="text-red-500 text-sm text-center mb-3">{sellerError}</p>
              )}

              <button onClick={handleBecomeSeller} disabled={isVerifyingSeller || !sellerCode} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg transition-shadow">
                {isVerifyingSeller ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Подтвердить'}
              </button>

              <button onClick={() => setShowSellerModal(false)} className="w-full py-2 mt-2 text-gray-500 text-sm hover:text-gray-700">Отмена</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
