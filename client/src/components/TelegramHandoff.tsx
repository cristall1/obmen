import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        openTelegramLink: (url: string) => void;
        close: () => void;
      };
    };
  }
}
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

export function TelegramHandoff() {
  const { language, showHandoffModal, setShowHandoffModal, handoffData, registration, botUsername } = useStore();

  if (!showHandoffModal || !handoffData) return null;

  const handleOpenTelegram = () => {
    // Open Telegram Bot with start parameter
    const url = `https://t.me/${botUsername || 'ObmenP2PBot'}?start=order_${handoffData.orderId}`;

    // Try to open via Telegram WebApp API if available
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
      window.Telegram.WebApp.close();
    } else {
      window.open(url, '_blank');
    }

    setShowHandoffModal(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      onClick={() => setShowHandoffModal(false)}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-title">{t('continueInTelegram', language)}</h3>
          <button
            onClick={() => setShowHandoffModal(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <p className="text-body text-gray-600">{t('redirectNotice', language)}</p>

        <div className="border border-gray-200 rounded-md p-4 space-y-3">
          <h4 className="text-body font-medium text-gray-900">
            {t('transferredData', language)}
          </h4>
          <div className="space-y-2 text-body text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('orderIdLabel', language)}</span>
              <span className="font-medium text-gray-900">#{handoffData.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('name', language)}</span>
              <span className="font-medium text-gray-900">{registration.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('phone', language)}</span>
              <span className="font-medium text-gray-900">{registration.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('amountLabel', language)}</span>
              <span className="font-medium text-gray-900">{handoffData.amountStr}</span>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenTelegram}
          className="w-full"
        >
          {t('openTelegram', language)}
        </Button>
      </motion.div>
    </div>
  );
}
