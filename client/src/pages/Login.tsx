import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export function Login() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');

    const handleLogin = () => {
        navigate('/dashboard');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-white p-6 flex flex-col"
        >
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-gray-500 mb-8">Enter your phone number to login</p>

                <div className="space-y-4 mb-8">
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

                <button onClick={handleLogin} className="btn-primary mb-6">
                    <span>Log In</span>
                    <ChevronRight size={20} />
                </button>

                <div className="text-center">
                    <p className="text-gray-500">
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="text-black font-semibold hover:underline"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
