import React, { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { X, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { sendChatHandoff } from '@/lib/api';

function AddReviewSheet() {
  const { language, selectedPost, setShowAddReviewModal, addReview } = useStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!selectedPost) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addReview(selectedPost.id, {
        authorName: 'Вы',
        rating,
        comment: comment.trim(),
        timeAgo: 'только что'
      });
      setShowAddReviewModal(false);
      setComment('');
      setRating(5);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-t-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-title text-gray-900">{t('addReview', language)}</h3>
          <button
            onClick={() => setShowAddReviewModal(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body font-medium text-gray-900 mb-2">
              {t('yourRating', language)}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'text-black fill-black' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-body font-medium text-gray-900 mb-2">
              {t('yourComment', language)}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('yourComment', language)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-body text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black/20"
              required
            />
          </div>

          <Button type="submit" variant="primary" className="w-full">
            {t('publish', language)}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export function PostDetails() {
  const {
    language,
    selectedPost,
    setSelectedPost,
    showAddReviewModal,
    setShowAddReviewModal,
    registration,
    userId,
    setEditingPost
  } = useStore();

  if (!selectedPost) return null;

  const isOwner = selectedPost.owner === 'me' || (selectedPost as any).ownerId === userId;

  const handleWrite = async () => {
    if (!(selectedPost as any).ownerId) {
      alert(t('noRecipient', language) || 'Неизвестен получатель');
      return;
    }
    try {
      await sendChatHandoff(
        (selectedPost as any).ownerId,
        userId,
        {
          post_id: selectedPost.id,
          title: selectedPost.title || selectedPost.pair,
          amount: selectedPost.amount,
          currency: selectedPost.currency,
          location: selectedPost.location,
          name: registration.name,
          phone: registration.phone
        }
      );
      alert(t('messageSent', language) || 'Сообщение отправлено в Telegram');
    } catch (e) {
      alert(t('messageFailed', language) || 'Не удалось отправить сообщение');
    } finally {
      setSelectedPost(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-md bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-title text-gray-900">{t('postDetails', language)}</h2>
            <button
              onClick={() => setSelectedPost(null)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Photo */}
            <div className="w-full h-48 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
              {selectedPost.thumbnailUrl ? (
                <img src={selectedPost.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>

            {/* Title and Amount */}
            <div>
              <h3 className="text-title text-gray-900 mb-2">
                {selectedPost.title || selectedPost.pair}
              </h3>
              <div className="flex items-center gap-2 text-body text-gray-600">
                <MapPin size={16} />
                <span>{selectedPost.location}</span>
                <span>·</span>
                <span>{selectedPost.timeAgo}</span>
              </div>
              <div className="mt-2 text-body font-medium text-gray-900">
                {selectedPost.amountStr}
              </div>
            </div>

            {/* Description */}
            {selectedPost.description && (
              <div>
                <h4 className="text-body font-medium text-gray-900 mb-2">
                  {t('description', language)}
                </h4>
                <p className="text-body text-gray-600 leading-relaxed">
                  {selectedPost.description}
                </p>
              </div>
            )}

            {/* Accepted Currencies */}
            {selectedPost.acceptedCurrencies && selectedPost.acceptedCurrencies.length > 0 && (
              <div>
                <h4 className="text-body font-medium text-gray-900 mb-2">
                  {t('acceptedCurrencies', language)}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPost.acceptedCurrencies.map((currency) => (
                    <span
                      key={currency}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-caption font-medium rounded-md"
                    >
                      {currency}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {selectedPost.reviews && selectedPost.reviews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-body font-medium text-gray-900">
                    {t('reviews', language)}
                  </h4>
                  {selectedPost.averageRating && (
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-black fill-black" />
                      <span className="text-body font-medium text-gray-900">
                        {selectedPost.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-3">
                  {selectedPost.reviews.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-body font-medium text-gray-900">
                          {review.authorName}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} size={14} className="text-black fill-black" />
                          ))}
                        </div>
                      </div>
                      <p className="text-caption text-gray-600 mb-1">{review.comment}</p>
                      <span className="text-caption text-gray-400">{review.timeAgo}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setShowAddReviewModal(true)}
                  className="w-full"
                >
                  {t('addReview', language)}
                </Button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 space-y-2">
            {isOwner ? (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingPost(selectedPost as any);
                  setSelectedPost(null);
                }}
                className="w-full"
              >
                {t('edit', language) || 'Редактировать пост'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleWrite}
                className="w-full"
              >
                {t('write', language)}
              </Button>
            )}

          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddReviewModal && <AddReviewSheet />}
      </AnimatePresence>
    </>
  );
}
