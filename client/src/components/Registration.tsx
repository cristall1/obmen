import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { Button } from './ui/button';
import { User, Briefcase, Copy, Check, RefreshCw, ExternalLink, LogIn } from 'lucide-react';
import { generateVerificationCode, checkVerified } from '@/lib/api';
import { cn } from '@/lib/utils';
import { LoadingScreen } from './LoadingScreen';

export function Registration() {
  const { registration, setRegistration, role, setRole, completeRegistration, botUsername, userId } = useStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLoading, setShowLoading] = useState(false);

  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Poll for verification status
  useEffect(() => {
    if (!generatedCode) return;

    const checkStatus = async () => {
      try {
        const result = await checkVerified(generatedCode);
        if (result.verified) {
          setRegistration({ verified: true });
        }
      } catch (e) {
        console.error('Check failed', e);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [generatedCode, setRegistration]);

  const handleGenerateCode = async () => {
    setErrors({});
    if (!registration.name?.trim()) {
      setErrors({ name: 'Укажите имя' });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateVerificationCode(
        '',
        userId,
        '',
        registration.name
      );
      if (result && result.code) {
        setGeneratedCode(result.code);
      } else {
        setErrors({ code: 'Ошибка генерации' });
      }
    } catch (e) {
      console.error('Generate code error:', e);
      setErrors({ code: 'Ошибка сервера' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const result = await checkVerified(generatedCode);
      if (result.verified) {
        setRegistration({ verified: true });
      } else {
        setErrors({ code: 'Код ещё не подтверждён' });
      }
    } catch (e) {
      setErrors({ code: 'Ошибка проверки' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = () => {
    if (!registration.name?.trim()) {
      setErrors({ name: 'Укажите имя' });
      return;
    }
    if (!registration.verified) {
      setErrors({ code: 'Подтвердите код через бота' });
      return;
    }
    if (!registration.agreed) {
      setErrors({ agreed: 'Примите условия' });
      return;
    }

    setErrors({});
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    completeRegistration();
  };

  return (
    <>
      <LoadingScreen
        show={showLoading}
        type="welcome"
        onComplete={handleLoadingComplete}
      />

      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Выберите роль
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setRole('client');
                setRegistration({ role: 'client' });
              }}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2',
                role === 'client'
                  ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                role === 'client' ? 'bg-white/20' : 'bg-gray-100'
              )}>
                <User size={24} className={role === 'client' ? 'text-white' : 'text-gray-600'} />
              </div>
              <span className="font-semibold">Пользователь</span>
              <span className={cn('text-xs', role === 'client' ? 'text-gray-300' : 'text-gray-500')}>
                Ищу обмен
              </span>
            </button>

            <button
              onClick={() => {
                setRole('exchanger');
                setRegistration({ role: 'exchanger' });
              }}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2',
                role === 'exchanger'
                  ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                role === 'exchanger' ? 'bg-white/20' : 'bg-gray-100'
              )}>
                <Briefcase size={24} className={role === 'exchanger' ? 'text-white' : 'text-gray-600'} />
              </div>
              <span className="font-semibold">Обменник</span>
              <span className={cn('text-xs', role === 'exchanger' ? 'text-gray-300' : 'text-gray-500')}>
                Предлагаю обмен
              </span>
            </button>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ваше имя
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={registration.name}
              onChange={(e) => setRegistration({ name: e.target.value })}
              placeholder="Введите имя"
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
            />
          </div>
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Verification Section */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          <div className="text-sm font-semibold text-gray-800">
            Подтверждение
          </div>

          {!generatedCode ? (
            <Button
              onClick={handleGenerateCode}
              disabled={isGenerating || !registration.name?.trim()}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={18} />
                  Генерация...
                </>
              ) : (
                'Получить код'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Code Display */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                  <span className="text-3xl font-mono font-bold tracking-[0.3em] text-gray-900">
                    {generatedCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-600" />}
                </button>
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600 space-y-2 bg-white rounded-xl p-4 border border-gray-100">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-medium">1</span>
                  Скопируйте код
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-medium">2</span>
                  Откройте бота и нажмите "Подтвердить код"
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-medium">3</span>
                  Отправьте номер телефона и введите код
                </p>
              </div>

              {/* Status */}
              {registration.verified ? (
                <div className="flex items-center gap-3 text-green-600 bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={18} className="text-white" />
                  </div>
                  <span className="font-semibold">Подтверждено!</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCheckVerification}
                    disabled={isChecking}
                    className="py-3 px-4 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isChecking ? <RefreshCw className="animate-spin" size={16} /> : null}
                    Проверить
                  </button>
                  <button
                    onClick={() => window.open(`https://t.me/${botUsername || 'malxam_proverkBot'}`, '_blank')}
                    className="py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Открыть бота
                  </button>
                </div>
              )}

              {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
            </div>
          )}
        </div>

        {/* Agreement */}
        <label className="flex items-center gap-4 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={registration.agreed}
              onChange={(e) => setRegistration({ agreed: e.target.checked })}
              className="sr-only peer"
            />
            <div className={cn(
              'w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center',
              registration.agreed
                ? 'bg-gray-900 border-gray-900'
                : 'bg-white border-gray-300 group-hover:border-gray-400'
            )}>
              {registration.agreed && <Check size={14} className="text-white" strokeWidth={3} />}
            </div>
          </div>
          <span className="text-sm text-gray-600">
            Я согласен с условиями использования
          </span>
        </label>
        {errors.agreed && <p className="text-red-500 text-sm ml-10">{errors.agreed}</p>}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!registration.verified || !registration.agreed || !registration.name?.trim()}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-base transition-all',
            registration.verified && registration.agreed && registration.name?.trim()
              ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          Продолжить
        </Button>

        {/* Login Link */}
        <div className="text-center">
          <button
            onClick={() => alert('Функция входа будет доступна в следующей версии')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 mx-auto"
          >
            <LogIn size={14} />
            У меня уже есть аккаунт
          </button>
        </div>
      </div>
    </>
  );
}
