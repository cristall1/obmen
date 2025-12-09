import { useStore } from '@/hooks/useStore';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, Shield, Sparkles } from 'lucide-react';

// NellX Logo as SVG
function NellXLogo({ className = "h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 50" className={className} fill="currentColor">
      {/* N */}
      <path d="M0 10 L0 40 L8 40 L8 22 L22 40 L30 40 L30 10 L22 10 L22 28 L8 10 Z" />
      {/* e */}
      <path d="M38 22 C38 16 43 12 50 12 C57 12 62 16 62 22 L62 26 L46 26 C47 30 50 32 54 32 C57 32 59 31 61 29 L61 36 C58 38 55 40 50 40 C43 40 38 34 38 28 L38 22 Z M46 22 L54 22 C54 19 52 17 50 17 C48 17 46 19 46 22 Z" />
      {/* l */}
      <path d="M68 5 L76 5 L76 40 L68 40 Z" />
      {/* l */}
      <path d="M82 5 L90 5 L90 40 L82 40 Z" />
      {/* X with arrows */}
      <g transform="translate(100, 0)">
        <path d="M0 10 L15 25 L0 40 L10 40 L20 30 L30 40 L40 40 L25 25 L40 10 L30 10 L20 20 L10 10 Z" />
        <path d="M35 5 L50 5 L50 8 L42 8 L42 20 L38 20 L38 8 L35 8 Z" />
        <path d="M45 2 L53 10 L45 10 Z" fill="currentColor" />
        <path d="M42 30 L42 42 L50 42 L50 45 L35 45 L35 42 L38 42 L38 30 Z" />
        <path d="M45 48 L53 40 L45 40 Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export function Registration() {
  const { openLogin, botUsername } = useStore();

  const handleOpenBot = () => {
    const username = botUsername || 'malxamibot';
    window.open(`https://t.me/${username}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center py-6"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="relative mb-6 text-gray-900"
      >
        <NellXLogo className="h-10" />

        {/* Telegram badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="absolute -bottom-3 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg"
        >
          <MessageCircle size={14} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Регистрация через бота
      </h2>

      {/* Description */}
      <p className="text-gray-500 mb-6 max-w-xs leading-relaxed">
        Создайте аккаунт в нашем Telegram боте.
      </p>

      {/* Benefits */}
      <div className="w-full space-y-3 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 text-left">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Безопасно</p>
            <p className="text-xs text-gray-500">Верификация через Telegram</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 text-left">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Уведомления</p>
            <p className="text-xs text-gray-500">О сделках в Telegram</p>
          </div>
        </div>
      </div>

      {/* Open Bot Button */}
      <Button
        onClick={handleOpenBot}
        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
      >
        <MessageCircle size={20} />
        Открыть бота
        <ArrowRight size={16} />
      </Button>

      {/* Login Link */}
      <p className="mt-6 text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <button onClick={openLogin} className="text-gray-900 font-semibold hover:underline">
          Войти
        </button>
      </p>

      <p className="mt-3 text-xs text-gray-400">
        @{botUsername || 'malxamibot'}
      </p>
    </motion.div>
  );
}
