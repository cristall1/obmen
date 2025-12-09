import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Star, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';

const API_BASE = '';

// Avatar component
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = { sm: 'w-10 h-10 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

    return (
        <div className={cn("rounded-full flex items-center justify-center text-white font-bold", sizeClasses[size], colors[colorIndex])}>
            {name?.charAt(0).toUpperCase() || '?'}
        </div>
    );
}

// Star Rating
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={14} className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
            ))}
        </div>
    );
}

// Parse URLs in text and make them clickable
function ParsedDescription({ text }: { text: string }) {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part.length > 40 ? part.slice(0, 40) + '...' : part}
                            <ExternalLink size={12} />
                        </a>
                    );
                }
                return part;
            })}
        </p>
    );
}

export function PostPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userId, removePost } = useStore();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) loadPost();
    }, [id]);

    const loadPost = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/posts/${id}`);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            setPost(data);
        } catch (e) {
            setError('Пост не найден');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Удалить этот пост?')) return;
        try {
            await removePost(id!);
            navigate('/');
        } catch (e) {
            alert('Ошибка удаления');
        }
    };

    const handleContact = () => {
        if (post?.author_username) {
            const username = post.author_username.replace('@', '');
            window.open(`https://t.me/${username}`, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">{error || 'Пост не найден'}</p>
                <button onClick={() => navigate('/')} className="mt-4 text-blue-500">
                    Вернуться
                </button>
            </div>
        );
    }

    const isOwner = post.user_id === userId;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-24"
        >
            {/* Author Header */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => navigate(`/user/${post.user_id}`)}>
                    <Avatar name={post.author_name || 'User'} size="md" />
                </button>
                <div className="flex-1">
                    <button
                        onClick={() => navigate(`/user/${post.user_id}`)}
                        className="font-semibold text-gray-900 hover:underline"
                    >
                        {post.author_name || 'Пользователь'}
                    </button>
                    <div className="flex items-center gap-2">
                        <StarRating rating={5} />
                        <span className="text-xs text-gray-500">5.0</span>
                    </div>
                </div>
                <span className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('ru')}
                </span>
            </div>

            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-gray-100 to-gray-50">
                {post.image_data || post.thumbnailUrl ? (
                    <img
                        src={post.image_data || post.thumbnailUrl}
                        alt=""
                        className="w-full aspect-video object-cover"
                    />
                ) : (
                    <div className="w-full aspect-video flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-300">{post.currency || 'USD'}</span>
                    </div>
                )}
            </div>

            {/* Primary Info */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                    {/* Rate */}
                    <div>
                        {post.rate ? (
                            <div className="text-3xl font-bold text-gray-900">{post.rate}</div>
                        ) : (
                            <div className="text-xl font-bold text-gray-900">{post.currency || 'USD'}</div>
                        )}
                        {post.amount && (
                            <div className="text-sm text-gray-500">
                                {post.amount.toLocaleString()} {post.currency}
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    {post.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                            <MapPin size={14} />
                            {post.location}
                        </div>
                    )}
                </div>

                {/* Type Badge */}
                {post.type && (
                    <div className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-medium",
                        post.type === 'buy' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                        {post.type === 'buy' ? 'Покупка' : 'Продажа'}
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Описание</h3>
                <ParsedDescription text={post.description || post.buy_description || ''} />
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
                {isOwner ? (
                    <button
                        onClick={handleDelete}
                        className="w-full py-4 bg-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Trash2 size={20} />
                        Удалить пост
                    </button>
                ) : (
                    <button
                        onClick={handleContact}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <MessageCircle size={20} />
                        Написать
                    </button>
                )}
            </div>
        </motion.div>
    );
}
