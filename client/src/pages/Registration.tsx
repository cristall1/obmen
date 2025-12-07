import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, ChevronRight, FileText } from 'lucide-react';
import { clsx } from 'clsx';

export function Registration() {
    const navigate = useNavigate();
    const [role, setRole] = useState<'client' | 'exchanger'>('client');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleRegister = () => {
        // TODO: Implement actual registration logic
        navigate('/dashboard');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-white p-6 flex flex-col"
        >
            {/* Header with Agreements */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">P2P Exchange</h1>
                <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-black transition-colors">
                    <FileText size={16} />
                    Agreements
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                <p className="text-gray-500 mb-8">Choose your role to get started</p>

                {/* Role Selection - Cards instead of Slider */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div
                        onClick={() => setRole('client')}
                        className={clsx(
                            "cursor-pointer p-4 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                            role === 'client'
                                ? "border-black bg-black text-white shadow-lg scale-105"
                                : "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100"
                        )}
                    >
                        <User size={24} />
                        <span className="font-medium">Client</span>
                    </div>

                    <div
                        onClick={() => setRole('exchanger')}
                        className={clsx(
                            "cursor-pointer p-4 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                            role === 'exchanger'
                                ? "border-black bg-black text-white shadow-lg scale-105"
                                : "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100"
                        )}
                    >
                        <Briefcase size={24} />
                        <span className="font-medium">Exchanger</span>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+998 90 123 45 67"
                            className="input-field"
                        />
                    </div>
                </div>

                <button onClick={handleRegister} className="btn-primary mb-6">
                    <span>Continue</span>
                    <ChevronRight size={20} />
                </button>

                <div className="text-center">
                    <p className="text-gray-500">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-black font-semibold hover:underline"
                        >
                            Log in
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
