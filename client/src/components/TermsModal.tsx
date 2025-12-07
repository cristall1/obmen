import { X } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export function TermsModal({ isOpen, onClose, onAgree }: TermsModalProps) {
  const { language } = useStore();

  const handleAgree = () => {
    onAgree();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-title font-semibold">{t('terms', language)}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4 text-body text-gray-700">
                <p>
                  Добро пожаловать в NellX. Используя наш сервис, вы соглашаетесь с
                  следующими условиями:
                </p>
                <h3 className="font-semibold text-gray-900">1. Общие положения</h3>
                <p>
                  NellX предоставляет платформу для обмена валют между пользователями.
                  Мы не являемся участниками сделок и не несём ответственности за
                  действия пользователей.
                </p>
                <h3 className="font-semibold text-gray-900">2. Обязанности пользователя</h3>
                <p>
                  Вы обязуетесь предоставлять только достоверную информацию, соблюдать
                  законодательство вашей страны и не использовать сервис для незаконной
                  деятельности.
                </p>
                <h3 className="font-semibold text-gray-900">3. Конфиденциальность</h3>
                <p>
                  Мы защищаем ваши персональные данные и не передаём их третьим лицам
                  без вашего согласия, за исключением случаев, предусмотренных законом.
                </p>
                <h3 className="font-semibold text-gray-900">4. Ограничение ответственности</h3>
                <p>
                  NellX не несёт ответственности за убытки, возникшие в результате
                  использования сервиса, включая потерю средств при сделках с другими
                  пользователями.
                </p>
                <h3 className="font-semibold text-gray-900">5. Изменения условий</h3>
                <p>
                  Мы оставляем за собой право изменять условия использования в любое
                  время. Продолжая использовать сервис, вы соглашаетесь с изменениями.
                </p>
                <p className="text-caption text-gray-500 pt-4">
                  Последнее обновление: декабрь 2025
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl space-y-2">
              <Button
                variant="primary"
                onClick={handleAgree}
                className="w-full"
              >
                {t('agree', language)}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full"
              >
                {t('close', language)}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
