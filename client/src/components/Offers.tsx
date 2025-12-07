import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { t } from '@/lib/i18n';
import { Clock, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bid } from '@/types';

export function Offers() {
  const { language, myOrders, fetchMyOrders, fetchOrderBids, acceptBid } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderBids, setOrderBids] = useState<Record<number, Bid[]>>({});
  const [loadingBids, setLoadingBids] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const toggleOrder = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    if (!orderBids[orderId]) {
      setLoadingBids(prev => ({ ...prev, [orderId]: true }));
      const bids = await fetchOrderBids(orderId);
      setOrderBids(prev => ({ ...prev, [orderId]: bids }));
      setLoadingBids(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    if (confirm(t('confirmAcceptBid', language) || 'Accept this offer?')) {
      await acceptBid(bidId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title">{t('myOrders', language) || 'My Orders'}</h2>
      </div>

      <div className="space-y-3">
        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('noOrders', language) || 'No active orders'}
          </div>
        ) : (
          myOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-xl bg-white border-gray-200 overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrder(order.id)}
              >
                <div>
                  <div className="text-body font-medium text-gray-900">
                    {order.amount} {order.currency}
                  </div>
                  <div className="text-caption text-gray-500 mt-1">
                    {order.location} • {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-caption font-medium px-2 py-1 rounded-full ${order.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {order.status}
                  </span>
                  {expandedOrderId === order.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-gray-50"
                  >
                    <div className="p-4 space-y-3 border-t border-gray-200">
                      <h4 className="text-caption font-medium text-gray-500 uppercase tracking-wider">
                        {t('offers', language)} ({orderBids[order.id]?.length || 0})
                      </h4>

                      {loadingBids[order.id] ? (
                        <div className="flex justify-center py-4">
                          <Loader className="animate-spin text-gray-400" size={20} />
                        </div>
                      ) : orderBids[order.id]?.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No offers yet
                        </div>
                      ) : (
                        orderBids[order.id]?.map((bid) => (
                          <div key={bid.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-body font-medium">
                                  Rate: {bid.rate}
                                </div>
                                <div className="text-caption text-gray-500 flex items-center gap-1">
                                  <Clock size={12} /> {bid.time_estimate} min
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-caption font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                                  ★ {bid.rating?.toFixed(1) || '5.0'}
                                </span>
                              </div>
                            </div>
                            {bid.comment && (
                              <div className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                                "{bid.comment}"
                              </div>
                            )}
                            {bid.status === 'accepted' ? (
                              <div className="w-full py-2 text-center text-green-600 bg-green-50 rounded-md font-medium text-sm border border-green-100">
                                {t('offerAccepted', language) || 'Offer Accepted'}
                              </div>
                            ) : order.status === 'active' ? (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleAcceptBid(bid.id)}
                              >
                                {t('acceptOffer', language) || 'Accept Offer'}
                              </Button>
                            ) : (
                              <div className="w-full py-2 text-center text-gray-400 bg-gray-50 rounded-md text-sm">
                                {t('orderClosed', language) || 'Order Closed'}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
