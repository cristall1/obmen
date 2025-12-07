import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { SimpleSelect } from './ui/SimpleSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = ['USD', 'BTC', 'UZS', 'Подписки', 'Прочее'];
const CURRENCIES = ['EGP', 'RUB', 'USD', 'USDT', 'UZS', 'KGS', 'KZT', 'CAD', 'TJS', 'BTC'];

export function EditPostSheet() {
    const { language, editingPost, setEditingPost, editPost } = useStore();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [location, setLocation] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('USD');
    const [acceptedCurrencies, setAcceptedCurrencies] = useState<string[]>(['USD']);
    const [type, setType] = useState<'buy' | 'sell'>('sell');

    useEffect(() => {
        if (editingPost) {
            setTitle(editingPost.title || editingPost.pair || '');
            setAmount(editingPost.amount?.toString() || '');
            setRate(editingPost.rate?.toString() || '');
            setLocation(editingPost.location || '');
            setImageUrl(editingPost.thumbnailUrl || '');
            setDescription(editingPost.description || '');
            setCategory(editingPost.category || 'USD');
            setAcceptedCurrencies(editingPost.acceptedCurrencies || ['USD']);
            setType(editingPost.type || 'sell');
        }
    }, [editingPost]);

    const toggleCurrency = (currency: string) => {
        if (acceptedCurrencies.includes(currency)) {
            setAcceptedCurrencies(acceptedCurrencies.filter(c => c !== currency));
        } else {
            setAcceptedCurrencies([...acceptedCurrencies, currency]);
        }
    };

    const handleSubmit = async () => {
        if (!editingPost || !title.trim() || !amount || !rate || !location.trim()) {
            return;
        }

        try {
            await editPost(editingPost.id, {
                amount: parseFloat(amount) || 0,
                rate: parseFloat(rate) || 0,
                description,
                type,
                // Add other fields as needed by backend
            });
            setEditingPost(null);
        } catch (error) {
            console.error('Failed to update post', error);
        }
    };

    if (!editingPost) return null;

    return (
        <AnimatePresence>
            {editingPost && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="fixed inset-0 bg-black/40 z-40"
                        onClick={() => setEditingPost(null)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-lg shadow-2xl z-50 max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-title font-semibold">{t('editPost', language)}</h2>
                            <button
                                onClick={() => setEditingPost(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {/* Type Toggle */}
                                <div className="flex p-1 bg-gray-100 rounded-lg">
                                    <button
                                        onClick={() => setType('buy')}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                            type === 'buy' ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {t('buy', language)}
                                    </button>
                                    <button
                                        onClick={() => setType('sell')}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                            type === 'sell' ? "bg-white shadow-sm text-red-600" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {t('sell', language)}
                                    </button>
                                </div>

                                <div>
                                    <label htmlFor="post-title" className="block text-body font-medium text-gray-900 mb-2">
                                        {t('title', language)}
                                    </label>
                                    <Input
                                        id="post-title"
                                        placeholder={t('enterTitle', language)}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-body bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="post-amount" className="block text-body font-medium text-gray-900 mb-2">
                                            {t('amount', language)}
                                        </label>
                                        <Input
                                            id="post-amount"
                                            type="number"
                                            placeholder="1000"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-body bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="post-rate" className="block text-body font-medium text-gray-900 mb-2">
                                            {t('rate', language)}
                                        </label>
                                        <Input
                                            id="post-rate"
                                            type="number"
                                            placeholder="12500"
                                            value={rate}
                                            onChange={(e) => setRate(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-body bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="post-location" className="block text-body font-medium text-gray-900 mb-2">
                                        {t('place', language)}
                                    </label>
                                    <Input
                                        id="post-location"
                                        placeholder={t('enterPlace', language)}
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-body bg-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="post-image" className="block text-body font-medium text-gray-900 mb-2">
                                        {t('imageUrl', language)}
                                    </label>
                                    <Input
                                        id="post-image"
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-body bg-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="post-description" className="block text-body font-medium text-gray-900 mb-2">
                                        {t('description', language)}
                                    </label>
                                    <textarea
                                        id="post-description"
                                        placeholder={t('enterDescription', language)}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-body bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-body font-medium text-gray-900 mb-2">
                                        {t('category', language)}
                                    </label>
                                    <SimpleSelect
                                        options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                        value={category}
                                        onChange={setCategory}
                                        className="rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-body font-medium text-gray-900 mb-2">
                                        {t('acceptedCurrencies', language)}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {CURRENCIES.map((currency) => (
                                            <button
                                                key={currency}
                                                type="button"
                                                onClick={() => toggleCurrency(currency)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-full text-caption font-medium transition-all',
                                                    acceptedCurrencies.includes(currency)
                                                        ? 'bg-black text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                )}
                                            >
                                                {currency}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={!title.trim() || !amount || !rate || !location.trim()}
                                className="w-full"
                            >
                                {t('saveChanges', language)}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
