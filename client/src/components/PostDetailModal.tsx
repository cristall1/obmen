import { useState, useEffect } from 'react';
import { X, MapPin, Pencil, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface PostDetailModalProps {
    post: any;
    isOwn: boolean;
    onClose: () => void;
    onChat: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'RUB', 'EGP', 'UZS', 'USDT', 'KZT', 'KGS', 'TJS'];

export function PostDetailModal({ post, isOwn, onClose, onChat }: PostDetailModalProps) {
    const { editPost, removePost } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editData, setEditData] = useState({
        description: '',
        amount: '',
        rate: '',
        location: '',
        currency: 'USD',
    });

    useEffect(() => {
        if (post) {
            setEditData({
                description: post.description || '',
                amount: post.amount?.toString() || '',
                rate: post.rate?.toString() || '',
                location: post.location || '',
                currency: post.currency || 'USD',
            });
            setIsEditing(false);
            setIsDeleting(false);
        }
    }, [post]);

    const handleSave = async () => {
        if (!post) return;
        await editPost(post.id, {
            description: editData.description,
            amount: parseFloat(editData.amount) || 0,
            rate: parseFloat(editData.rate) || 0,
            location: editData.location,
            currency: editData.currency,
        });
        setIsEditing(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!post) return;
        await removePost(post.id);
        onClose();
    };

    if (!post) return null;

    return (
        <AnimatePresence>
            {post && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-base font-bold">
                                {isEditing ? 'Редактирование' : `${post.currency || 'USD'} → EGP`}
                            </h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Описание</label>
                                        <textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Валюта</label>
                                            <select
                                                value={editData.currency}
                                                onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            >
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Курс</label>
                                            <Input
                                                type="number"
                                                value={editData.rate}
                                                onChange={(e) => setEditData({ ...editData, rate: e.target.value })}
                                                className="py-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Сумма</label>
                                            <Input
                                                type="number"
                                                value={editData.amount}
                                                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                className="py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Район</label>
                                            <Input
                                                type="text"
                                                value={editData.location}
                                                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                                placeholder="например: 5-й район"
                                                className="py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {post.rate && (
                                        <div className="p-3 bg-green-50 rounded-xl">
                                            <div className="text-[10px] text-green-600 font-medium uppercase">Курс</div>
                                            <div className="text-2xl font-bold text-green-700">{post.rate}</div>
                                        </div>
                                    )}

                                    {post.amount && (
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <div className="text-[10px] text-gray-500 font-medium uppercase">Сумма</div>
                                            <div className="text-xl font-bold text-gray-900">{post.amount?.toLocaleString()} {post.currency}</div>
                                        </div>
                                    )}

                                    {post.description && (
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <div className="text-[10px] text-gray-500 font-medium uppercase mb-1">Описание</div>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap">{post.description}</div>
                                        </div>
                                    )}

                                    {post.location && (
                                        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                            <MapPin size={14} />
                                            <span>{post.location}</span>
                                        </div>
                                    )}

                                    {(post.thumbnailUrl || post.image_data) && (
                                        <img
                                            src={post.thumbnailUrl || post.image_data}
                                            alt=""
                                            className="w-full rounded-xl"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm"
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        className="flex-1 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm"
                                    >
                                        Сохранить
                                    </Button>
                                </div>
                            ) : isOwn ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            className="flex-1 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm flex items-center justify-center gap-1.5"
                                        >
                                            <Pencil size={14} />
                                            Редактировать
                                        </Button>
                                        <Button
                                            onClick={() => setIsDeleting(true)}
                                            className="py-3 px-4 bg-red-500 text-white hover:bg-red-600 rounded-xl text-sm"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>

                                    {isDeleting && (
                                        <div className="p-3 bg-red-50 rounded-xl">
                                            <p className="text-red-700 text-xs mb-2">Удалить этот пост?</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => setIsDeleting(false)}
                                                    className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs"
                                                >
                                                    Нет
                                                </Button>
                                                <Button
                                                    onClick={handleDelete}
                                                    className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs"
                                                >
                                                    Да, удалить
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Button
                                    onClick={onChat}
                                    className="w-full py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm flex items-center justify-center gap-1.5"
                                >
                                    <MessageCircle size={14} />
                                    Написать автору
                                    <ExternalLink size={12} className="ml-1 opacity-60" />
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
