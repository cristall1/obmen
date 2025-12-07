import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { Check, Clock } from 'lucide-react';

export function Status() {
  const { language, setShowHandoffModal } = useStore();

  const steps = [
    { key: 'created', completed: true },
    { key: 'offerAcceptedShort', completed: true },
    { key: 'inProgress', completed: false },
    { key: 'done', completed: false }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-title">{t('requestStatus', language)}</h2>

      {/* Timeline */}
      <div className="space-y-4">
        {steps.map((step, _index) => (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {step.completed ? (
                <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <Clock size={12} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 pt-0.5">
              <div className={`text-body ${step.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {t(step.key, language)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deal Details */}
      <div className="border border-gray-200 rounded-md p-4 space-y-3">
        <h3 className="text-body font-medium text-gray-900">{t('dealDetails', language)}</h3>
        <div className="space-y-2 text-body text-gray-600">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('send', language)}</span>
            <span className="font-medium">$1000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receive', language)}</span>
            <span className="font-medium">₽75000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('exchangerLabel', language)}</span>
            <span className="font-medium">Азат</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('place', language)}</span>
            <span className="font-medium">7 район</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowHandoffModal(true)}
        className="w-full py-3 btn-primary rounded-md text-body font-medium"
      >
        {t('chatInTelegram', language)}
      </button>
    </div>
  );
}
