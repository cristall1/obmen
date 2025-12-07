import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
    show: boolean;
    type?: 'welcome' | 'seller' | 'role';
    message?: string;
    onComplete?: () => void;
}

export function LoadingScreen({ show, type = 'welcome', message, onComplete }: LoadingScreenProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!show) {
            setStep(0);
            return;
        }

        const timer1 = setTimeout(() => setStep(1), 500);
        const timer2 = setTimeout(() => setStep(2), 1200);
        const timer3 = setTimeout(() => {
            setStep(3);
            if (onComplete) {
                setTimeout(onComplete, 500);
            }
        }, 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [show, onComplete]);

    const messages = {
        welcome: ['Добро пожаловать!', 'Настраиваем ваш профиль...', 'Готово!'],
        seller: ['Верификация продавца', 'Проверяем данные...', 'Вы теперь продавец!'],
        role: ['Смена роли', 'Переключаем...', 'Готово!'],
    };

    const currentMessages = messages[type];

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="mb-8"
                    >
                        {type === 'seller' ? (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <Sparkles size={40} className="text-white" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                                <Check size={40} className="text-white" />
                            </div>
                        )}
                    </motion.div>

                    {/* Message */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {message || currentMessages[Math.min(step, currentMessages.length - 1)]}
                        </h2>
                    </motion.div>

                    {/* Progress dots */}
                    <div className="flex gap-2 mt-8">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className={`w-2 h-2 rounded-full ${step >= i ? 'bg-gray-900' : 'bg-gray-200'}`}
                                animate={{ scale: step === i ? 1.2 : 1 }}
                            />
                        ))}
                    </div>

                    {/* Confetti for seller verification */}
                    {type === 'seller' && step === 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 pointer-events-none overflow-hidden"
                        >
                            {[...Array(30)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        top: -20,
                                        left: `${Math.random() * 100}%`,
                                        rotate: 0,
                                        opacity: 1
                                    }}
                                    animate={{
                                        top: '100%',
                                        rotate: Math.random() * 360,
                                        opacity: 0
                                    }}
                                    transition={{
                                        duration: 2 + Math.random(),
                                        delay: Math.random() * 0.5,
                                        ease: "linear"
                                    }}
                                    className="absolute w-3 h-3"
                                    style={{
                                        background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
                                        borderRadius: Math.random() > 0.5 ? '50%' : '0'
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
