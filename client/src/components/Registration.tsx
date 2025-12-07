import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { Button } from './ui/button';
import { User, Lock, Copy, Check, RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from './LoadingScreen';

const API_BASE = '';

async function apiCall(endpoint: string, data: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export function Registration() {
  const { setRegistration, completeRegistration, botUsername } = useStore();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Poll for verification
  useEffect(() => {
    if (!verificationCode || verified) return;

    const checkStatus = async () => {
      try {
        const result = await apiCall('/api/auth/check-verified', { code: verificationCode });
        if (result.verified) {
          setVerified(true);
          setRegistration({
            name: result.name,
            verified: true,
            completed: false
          });
        }
      } catch (e) {
        console.error('Check failed', e);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [verificationCode, verified, setRegistration]);

  const handleRegister = async () => {
    setErrors({});

    if (!nickname || nickname.length < 3) {
      setErrors({ nickname: 'Минимум 3 символа' });
      return;
    }
    if (!password || password.length < 4) {
      setErrors({ password: 'Минимум 4 символа' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiCall('/api/auth/register', { nickname, name, password });

      if (result.error === 'nickname_exists') {
        setErrors({ nickname: 'Этот ник уже занят' });
        return;
      }
      if (result.error) {
        setErrors({ general: 'Ошибка регистрации' });
        return;
      }

      setVerificationCode(result.code);
      setShowVerification(true);
    } catch (e) {
      setErrors({ general: 'Ошибка сети' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrors({});

    if (!nickname) {
      setErrors({ nickname: 'Введите ник' });
      return;
    }
    if (!password) {
      setErrors({ password: 'Введите пароль' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiCall('/api/auth/login', { nickname, password });

      if (result.error === 'invalid_credentials') {
        setErrors({ general: 'Неверный ник или пароль' });
        return;
      }
      if (result.error) {
        setErrors({ general: 'Ошибка входа' });
        return;
      }

      // Successful login
      setRegistration({
        name: result.name,
        verified: result.telegram_linked,
        completed: true
      });

      setShowLoading(true);
    } catch (e) {
      setErrors({ general: 'Ошибка сети' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
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

      <div className="space-y-5">
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setMode('register')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
              mode === 'register' ? 'bg-white shadow-sm' : 'text-gray-500'
            )}
          >
            Регистрация
          </button>
          <button
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
              mode === 'login' ? 'bg-white shadow-sm' : 'text-gray-500'
            )}
          >
            Вход
          </button>
        </div>

        {!showVerification ? (
          <>
            {/* Nickname */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ваш ник (логин)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="nickname"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname}</p>}
            </div>

            {/* Name (only for register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Имя (отображаемое)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {errors.general && (
              <p className="text-red-500 text-sm text-center">{errors.general}</p>
            )}

            {/* Submit Button */}
            <Button
              onClick={mode === 'register' ? handleRegister : handleLogin}
              disabled={isLoading}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-sm"
            >
              {isLoading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
            </Button>
          </>
        ) : (
          /* Verification Step */
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg">Подтвердите аккаунт</h3>
              <p className="text-sm text-gray-500 mt-1">
                Скопируйте код и отправьте его боту
              </p>
            </div>

            {/* Code Display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                <span className="text-2xl font-mono font-bold tracking-[0.2em] text-gray-900">
                  {verificationCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-600" />}
              </button>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 space-y-2 bg-gray-50 rounded-xl p-3">
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Скопируйте код выше</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Откройте бота и нажмите "Подтвердить код"</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Отправьте номер телефона и введите код</span>
              </p>
            </div>

            {/* Status */}
            {verified ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
                <span className="font-medium text-sm">Подтверждено!</span>
              </div>
            ) : (
              <button
                onClick={() => window.open(`https://t.me/${botUsername || 'malxam_proverkBot'}`, '_blank')}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                Открыть бота
              </button>
            )}

            {verified && (
              <Button
                onClick={handleComplete}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-sm"
              >
                Продолжить
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
