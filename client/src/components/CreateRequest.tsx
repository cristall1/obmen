import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { SimpleSelect } from './ui/SimpleSelect';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type RequestType = 'delivery' | 'pickup';

const currencies = ['EGP', 'RUB', 'USD', 'USDT', 'UZS', 'KGS', 'KZT', 'CAD', 'TJS', 'BTC'];
const currencyOptions = currencies.map(c => ({ value: c, label: c }));

export function CreateRequest() {
  const { language, prefillData, clearPrefill, submitOrder } = useStore();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('RUB');
  const [place, setPlace] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('delivery');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefillData) {
      if (prefillData.fromCurrency) setFromCurrency(prefillData.fromCurrency);
      if (prefillData.toCurrency) setToCurrency(prefillData.toCurrency);
      clearPrefill();
    }
  }, [prefillData, clearPrefill]);

  const handleSubmit = async () => {
    if (!amount || !place) return;

    setIsSubmitting(true);
    try {
      await submitOrder({
        amount: parseFloat(amount),
        currency: fromCurrency,
        location: place,
        delivery_type: requestType,
        comment
      });
      alert(t('requestCreated', language) || 'Заявка создана!');
      setAmount('');
      setPlace('');
      setComment('');
    } catch (error) {
      alert('Error creating request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-title mb-8">{t('createRequestTitle', language)}</h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="amount" className="block text-body font-medium text-gray-900 mb-2">
              {t('amount', language)}
            </label>
            <input
              id="amount"
              type="number"
              placeholder={t('enterAmount', language)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-body bg-white focus-visible:ring-2 focus-visible:ring-black/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-body font-medium text-gray-900 mb-2">
                {t('send', language)}
              </label>
              <SimpleSelect
                options={currencyOptions}
                value={fromCurrency}
                onChange={setFromCurrency}
              />
            </div>
            <div>
              <label className="block text-body font-medium text-gray-900 mb-2">
                {t('receive', language)}
              </label>
              <SimpleSelect
                options={currencyOptions}
                value={toCurrency}
                onChange={setToCurrency}
              />
            </div>
          </div>

          <div>
            <label htmlFor="place" className="block text-body font-medium text-gray-900 mb-2">
              {t('place', language)}
            </label>
            <input
              id="place"
              type="text"
              placeholder={t('enterPlace', language)}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body bg-white focus-visible:ring-2 focus-visible:ring-black/20"
            />
          </div>

          <div>
            <label className="block text-body font-medium text-gray-900 mb-2">
              {t('type', language)}
            </label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setRequestType('delivery')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg text-body font-medium transition-all',
                  requestType === 'delivery'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {t('delivery', language)}
              </button>
              <button
                type="button"
                onClick={() => setRequestType('pickup')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg text-body font-medium transition-all',
                  requestType === 'pickup'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {t('pickup', language)}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-body font-medium text-gray-900 mb-2">
              {t('comment', language)}
            </label>
            <textarea
              id="comment"
              placeholder={t('addComment', language)}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body resize-none bg-white focus-visible:ring-2 focus-visible:ring-black/20"
            />
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !amount || !place}
          className="w-full mt-8"
        >
          {isSubmitting ? '...' : t('createRequest', language)}
        </Button>
      </div>
    </motion.div>
  );
}
