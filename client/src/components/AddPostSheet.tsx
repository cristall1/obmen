import { useState } from 'react';
import { X, MapPin, Eye } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USD', 'EUR', 'RUB', 'EGP', 'UZS', 'USDT', 'KZT', 'KGS', 'TJS'];
const LOCATION_HINTS = ['4-й район', '5-й район', '6-й район', '7-й район', '8-й район', '9-й район', '10-й район', 'Ваха', 'Хургада', 'Шарм'];

export function AddPostSheet() {
  const { showAddPostModal, setShowAddPostModal, addPost } = useStore();
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('');
  const [imageData, setImageData] = useState<string>('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showPreview, setShowPreview] = useState(false);
  const [showLocationHints, setShowLocationHints] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) {
      return;
    }

    addPost({
      pair: currency,
      fromCurrency: currency,
      toCurrency: 'EGP',
      location: location || '',
      timeAgo: 'Только что',
      delta: '+0%',
      deltaType: 'positive' as const,
      amountStr: amount ? `${amount} ${currency}` : '',
      title: description.slice(0, 50),
      thumbnailUrl: imageData || undefined,
      image_data: imageData,
      description,
      acceptedCurrencies: [currency],
      reviews: [],
      averageRating: 0,
      category: currency,
      owner: 'me',
      type: 'sell',
      amount: parseFloat(amount) || 0,
      rate: parseFloat(rate) || 0,
      currency
    });

    resetForm();
    setShowAddPostModal(false);
  };

  const resetForm = () => {
    setAmount('');
    setRate('');
    setLocation('');
    setImageData('');
    setDescription('');
    setCurrency('USD');
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
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-bold">Новое объявление</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    showPreview ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  <Eye size={16} />
                </button>
                <button onClick={() => setShowAddPostModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {showPreview ? (
                <div className="p-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="text-base font-bold mb-2">{currency} → EGP</div>
                    {rate && <div className="text-xl font-bold text-green-600 mb-2">Курс: {rate}</div>}
                    {amount && <div className="text-gray-600 text-sm mb-2">Сумма: {amount} {currency}</div>}
                    <div className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{description || 'Описание...'}</div>
                    {location && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin size={12} />
                        {location}
                      </div>
                    )}
                    {imageData && (
                      <img src={imageData} alt="" className="mt-2 rounded-lg w-full h-24 object-cover" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Описание</label>
                    <textarea
                      placeholder="Опишите ваше предложение..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-1 focus:ring-gray-900/10"
                    />
                  </div>

                  {/* Currency & Rate */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Валюта</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Курс</label>
                      <Input
                        type="number"
                        placeholder="47.50"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="py-2"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Сумма (необязательно)</label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="py-2"
                    />
                  </div>

                  {/* Location with hints */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Район (необязательно)
                    </label>
                    <Input
                      type="text"
                      placeholder="Введите или выберите район"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onFocus={() => setShowLocationHints(true)}
                      onBlur={() => setTimeout(() => setShowLocationHints(false), 200)}
                      className="py-2"
                    />
                    {showLocationHints && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                        {LOCATION_HINTS.filter(h => !location || h.toLowerCase().includes(location.toLowerCase())).map((hint) => (
                          <button
                            key={hint}
                            type="button"
                            onMouseDown={() => setLocation(hint)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            {hint}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Фото (необязательно)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setImageData(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:text-xs"
                    />
                    {imageData && (
                      <div className="mt-2 relative inline-block">
                        <img src={imageData} alt="" className="h-16 rounded-lg object-cover" />
                        <button
                          onClick={() => setImageData('')}
                          className="absolute -top-1 -right-1 p-0.5 bg-black/60 rounded-full text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <Button
                onClick={handleSubmit}
                disabled={!description.trim()}
                className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400"
              >
                Опубликовать
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
