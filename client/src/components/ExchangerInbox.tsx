import { useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { Clock, Loader } from 'lucide-react';

export function ExchangerInbox() {
  const { language, myBids, fetchMyBids } = useStore();

  useEffect(() => {
    fetchMyBids();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title">{t('myBids', language) || 'My Bids'}</h2>
      </div>

      <div className="space-y-3">
        {myBids.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('noBids', language) || 'No bids yet'}
          </div>
        ) : (
          myBids.map((bid) => (
            <div
              key={bid.id}
              className="border rounded-xl p-4 space-y-3 bg-white border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-body font-medium text-gray-900">
                    {bid.amount} {bid.currency} @ {bid.rate}
                  </div>
                  <div className="text-caption text-gray-500 mt-1">
                    {bid.location}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {bid.order_status === 'active' && (
                    <span className="flex items-center gap-1 text-caption font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-600">
                      <Loader size={12} /> Pending
                    </span>
                  )}
                  {bid.order_status === 'closed' && (
                    <span className="flex items-center gap-1 text-caption font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Closed
                    </span>
                  )}
                  {/* We need a way to know if *this* bid was accepted. 
                      For now, just showing order status. */}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-caption text-gray-500">
                  <Clock size={12} />
                  <span>{bid.time_estimate} min</span>
                </div>
                <div className="text-caption text-gray-400">
                  {new Date(bid.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
