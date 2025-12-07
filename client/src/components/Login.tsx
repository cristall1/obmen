import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

export function Login() {
  const { language, completeLogin, closeLogin } = useStore();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!phone.trim()) {
      newErrors.phone = t('phoneRequired', language);
    }
    if (!name.trim()) {
      newErrors.name = t('nameRequired', language);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    completeLogin({ name, phone });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-title mb-8">{t('login', language)}</h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="login-phone" className="block text-caption text-gray-500 mb-2 font-medium">
              {t('phone', language)}
            </label>
            <Input
              id="login-phone"
              type="tel"
              inputMode="tel"
              pattern="[0-9\s\+\-]+"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-md text-body bg-white"
            />
            {errors.phone && <p className="text-caption text-red-500 mt-2">{errors.phone}</p>}
          </div>
          <div>
            <label htmlFor="login-name" className="block text-caption text-gray-500 mb-2 font-medium">
              {t('name', language)}
            </label>
            <Input
              id="login-name"
              placeholder={t('yourName', language)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-md text-body bg-white"
            />
            {errors.name && <p className="text-caption text-red-500 mt-2">{errors.name}</p>}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          className="w-full mt-8 btn-primary py-3 rounded-md text-body font-medium"
        >
          {t('loginButton', language)}
        </Button>
        <button
          onClick={closeLogin}
          className="w-full mt-4 text-body text-gray-600 hover:text-gray-900 transition-colors"
        >
          {t('createAccount', language)}
        </button>
      </div>
    </motion.div>
  );
}
