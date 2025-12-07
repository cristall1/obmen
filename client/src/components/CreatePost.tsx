import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreatePostProps {
    onClose: () => void;
}

export function CreatePost({ onClose }: CreatePostProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white w-full max-w-md rounded-3xl p-6 relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold mb-6">New Market Post</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-3 rounded-2xl bg-green-100 text-green-700 font-medium">Sell</button>
                        <button className="py-3 rounded-2xl bg-gray-100 text-gray-500 font-medium">Buy</button>
                    </div>

                    <input type="number" placeholder="Amount" className="input-field" />
                    <input type="text" placeholder="Currency (USD)" className="input-field" />
                    <input type="number" placeholder="Rate" className="input-field" />
                    <textarea placeholder="Description / Location" className="input-field min-h-[100px] resize-none"></textarea>

                    <button className="btn-primary" onClick={onClose}>
                        Post Offer
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
