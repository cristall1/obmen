import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, Search, MapPin } from 'lucide-react';
import { CreatePost } from '../components/CreatePost';
import { clsx } from 'clsx';

export function Dashboard() {
    const [role, setRole] = useState<'client' | 'exchanger'>('client');
    const [showCreatePost, setShowCreatePost] = useState(false);

    const toggleRole = () => {
        setRole(r => r === 'client' ? 'exchanger' : 'client');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">P2P Exchange</h1>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                            <span className={clsx("w-2 h-2 rounded-full", role === 'client' ? "bg-blue-500" : "bg-green-500")}></span>
                            {role === 'client' ? 'Client Mode' : 'Exchanger Mode'}
                        </div>
                    </div>

                    <button
                        onClick={toggleRole}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-6">

                {/* Exchanger View */}
                {role === 'exchanger' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Create Post Button */}
                        <button
                            onClick={() => setShowCreatePost(true)}
                            className="w-full bg-black text-white p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-black/10 active:scale-95 transition-transform"
                        >
                            <div className="text-left">
                                <div className="font-bold text-lg">Create New Post</div>
                                <div className="text-white/60 text-sm">Add a buy/sell offer to the market</div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Plus size={24} />
                            </div>
                        </button>

                        <div className="text-lg font-bold">Recent Requests</div>

                        {/* Mock Feed */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">👤</div>
                                        <span className="font-medium">User #{1000 + i}</span>
                                    </div>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-500">2 min ago</span>
                                </div>
                                <div className="text-2xl font-bold mb-1">1,000 USD</div>
                                <div className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                                    <MapPin size={14} /> Tashkent, Chilanzar
                                </div>
                                <button className="btn-secondary py-3 text-sm">Place Bid</button>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Client View */}
                {role === 'client' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="card space-y-4">
                            <h2 className="text-lg font-bold">Exchange Money</h2>

                            <div className="flex gap-2">
                                <input type="number" placeholder="Amount" className="input-field flex-1" />
                                <select className="bg-gray-50 rounded-2xl px-4 font-medium outline-none">
                                    <option>USD</option>
                                    <option>UZS</option>
                                </select>
                            </div>

                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <select className="input-field pl-12 appearance-none">
                                    <option>Select Location</option>
                                    <option>Tashkent</option>
                                    <option>Samarkand</option>
                                </select>
                            </div>

                            <button className="btn-primary">
                                <Search size={20} />
                                <span>Find Offers</span>
                            </button>
                        </div>

                        <div className="text-lg font-bold">Market Offers</div>
                        {[1, 2].map((i) => (
                            <div key={i} className="card border-l-4 border-l-green-500">
                                <div className="flex justify-between">
                                    <span className="font-bold text-green-600">Selling USD</span>
                                    <span className="font-bold">12,500 UZS</span>
                                </div>
                                <div className="text-gray-500 text-sm mt-1">Center, near Hotel Uzbekistan</div>
                                <button className="mt-3 text-sm font-medium underline">Contact Exchanger</button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </main>

            <AnimatePresence>
                {showCreatePost && <CreatePost onClose={() => setShowCreatePost(false)} />}
            </AnimatePresence>
        </div>
    );
}
