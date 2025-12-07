import { useState } from 'react';
import { X, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const LOCATIONS = [
  'Район 4.5',
  'Район 6-10',
  'Ваха',
  'Хургада',
  'Шарм-эль-Шейх',
  'Каир'
];

export function AddPostSheet() {
  const { showAddPostModal, setShowAddPostModal, addPost, fetchMarketPosts } = useStore();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addPost({
        pair: 'USD',
        fromCurrency: 'USD',
        toCurrency: 'EGP',
        location: location || '',
        timeAgo: 'Только что',
        delta: '+0%',
        deltaType: 'positive' as const,
        amountStr: '',
        title: description.slice(0, 50),
        description,
        acceptedCurrencies: ['USD'],
        reviews: [],
        averageRating: 0,
        category: 'USD',
        owner: 'me',
        type: 'sell',
        amount: 0,
        rate: 0,
        currency: 'USD'
      });

      // Show success toast
      setShowSuccess(true);

      // Refresh feed and close
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        setShowAddPostModal(false);
        fetchMarketPosts();
      }, 1500);

    } catch (e) {
      alert('Ошибка создания поста');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLocation('');
    setDescription('');
  };

  if (!showAddPostModal) return null;

  return (
    <AnimatePresence>
      {showAddPostModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAddPostModal(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[85vh] flex flex-col"
          >
            {/* Success Toast */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center rounded-t-2xl"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Пост создан!</h3>
                  <p className="text-sm text-gray-500 mt-1">Объявление успешно опубликовано</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-bold">Новое объявление</h2>
              <button onClick={() => setShowAddPostModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  <MapPin size={12} className="inline mr-1" />
                  Район
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocation(loc)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm transition-all",
                        location === loc
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите ваше предложение...&#10;&#10;Например:&#10;Покупаю USD за EGP&#10;Курс 50.5&#10;Любая сумма"
                  className="w-full min-h-[150px] px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-4 border-t border-gray-100">
              <Button
                onClick={handleSubmit}
                disabled={!description.trim() || isSubmitting}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Опубликовать'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
