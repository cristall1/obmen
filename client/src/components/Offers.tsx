import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/hooks/useStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { t } from '@/lib/i18n';
import { Clock, ChevronDown, ChevronUp, Loader, DollarSign, MapPin, Send, CheckCircle, X, Trash2, Archive } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bid, Order } from '@/types';

const API_BASE = '';

export function Offers() {
  const { language, role, myOrders, fetchMyOrders, fetchOrderBids, acceptBid, myBids, fetchMyBids, userId } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderBids, setOrderBids] = useState<Record<number, Bid[]>>({});
  const [loadingBids, setLoadingBids] = useState<Record<number, boolean>>({});

  // For exchangers - orders they can bid on
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedBids, setCompletedBids] = useState<Bid[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Tab state for exchangers
  const [exchangerTab, setExchangerTab] = useState<'active' | 'completed'>('active');

  // Bid form state
  const [bidOrderId, setBidOrderId] = useState<number | null>(null);
  const [bidRate, setBidRate] = useState('');
  const [bidComment, setBidComment] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // WebSocket handler for real-time updates
  const handleWSMessage = useCallback((type: string, data: any) => {
    console.log('WebSocket message:', type, data);
    if (type === 'new_order' && role === 'exchanger') {
      // Add new order to list if it's not from us
      if (data.user_id !== userId) {
        setActiveOrders(prev => [data, ...prev.filter(o => o.id !== data.id)]);
      }
    } else if (type === 'new_bid' && role === 'client') {
      // Refresh orders to get new bid
      fetchMyOrders();
    }
  }, [role, userId, fetchMyOrders]);

  // Connect to WebSocket (non-blocking, delayed)
  useWebSocket(handleWSMessage);

  // Initial fetch - fast, non-blocking
  useEffect(() => {
    // Show UI immediately, fetch data in background
    setInitialLoading(false);

    if (role === 'exchanger') {
      fetchActiveOrdersSilent();
      fetchMyBidsSilent();
    } else {
      fetchMyOrders();
    }

    // Refresh every 30 seconds as fallback
    const interval = setInterval(() => {
      if (role === 'exchanger') {
        fetchActiveOrdersSilent();
        fetchMyBidsSilent();
      } else {
        fetchMyOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [role]);

  // Silent fetch - no loading spinner
  const fetchActiveOrdersSilent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/active`);
      const data = await res.json();
      const filtered = (data || []).filter((o: Order) => o.user_id !== userId);
      setActiveOrders(filtered);
    } catch (e) {
      console.error('Failed to fetch orders');
    }
  };

  const fetchMyBidsSilent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bids/my?user_id=${userId}`);
      const data = await res.json();
      const completed = data.filter((b: Bid) => b.status === 'accepted' || b.status === 'rejected');
      setCompletedBids(completed);
    } catch (e) {
      console.error('Failed to fetch bids');
    }
  };

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
      fetchMyOrders();
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (confirm('Отменить эту заявку?')) {
      try {
        await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, { method: 'POST' });
        fetchMyOrders();
      } catch (e) {
        alert('Ошибка при отмене');
      }
    }
  };

  const handleClearArchive = async () => {
    if (confirm('Очистить все завершённые заявки?')) {
      try {
        await fetch(`${API_BASE}/api/bids/completed?user_id=${userId}`, { method: 'DELETE' });
        setCompletedBids([]);
      } catch (e) {
        alert('Ошибка при очистке');
      }
    }
  };

  const handleSubmitBid = async () => {
    if (!bidOrderId || !bidRate) return;

    setSubmittingBid(true);
    try {
      const res = await fetch(`${API_BASE}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: bidOrderId,
          exchanger_id: userId,
          rate: parseFloat(bidRate),
          time_estimate: '15',
          comment: bidComment
        })
      });

      if (res.ok) {
        setBidOrderId(null);
        setBidRate('');
        setBidComment('');
        fetchMyBids();
        setActiveOrders(prev => prev.filter(o => o.id !== bidOrderId));
        alert('✅ Предложение отправлено клиенту!');
      }
    } catch (e) {
      alert('Ошибка отправки');
    } finally {
      setSubmittingBid(false);
    }
  };

  // Initial loading spinner
  if (initialLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // EXCHANGER VIEW
  if (role === 'exchanger') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setExchangerTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${exchangerTab === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Активные ({activeOrders.length})
          </button>
          <button
            onClick={() => setExchangerTab('completed')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${exchangerTab === 'completed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Завершённые ({completedBids.length})
          </button>
        </div>

        {/* Active Orders Tab */}
        {exchangerTab === 'active' && (
          <>
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Archive size={48} className="mx-auto mb-3 opacity-30" />
                {t('noActiveOrders', language) || 'Нет активных заявок'}
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <DollarSign size={18} className="text-green-500" />
                            {order.amount} {order.currency}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin size={14} />
                            {order.location}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {bidOrderId === order.id ? (
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          <input
                            type="number"
                            placeholder="Ваш курс"
                            value={bidRate}
                            onChange={(e) => setBidRate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Комментарий (необязательно)"
                            value={bidComment}
                            onChange={(e) => setBidComment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => setBidOrderId(null)} variant="outline" size="sm" className="flex-1">
                              Отмена
                            </Button>
                            <Button onClick={handleSubmitBid} size="sm" className="flex-1" disabled={submittingBid || !bidRate}>
                              {submittingBid ? <Loader size={16} className="animate-spin" /> : (
                                <><Send size={14} className="mr-1" />Отправить</>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => setBidOrderId(order.id)} className="w-full mt-2" size="sm">
                          <DollarSign size={16} className="mr-1" />
                          Предложить курс
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* My Pending Bids */}
            {myBids.filter((b: Bid) => b.status === 'pending').length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mt-6">
                  {t('myBids', language) || 'Мои предложения'}
                </h3>
                <div className="space-y-2">
                  {myBids.filter((b: Bid) => b.status === 'pending').map((bid: Bid) => (
                    <div key={bid.id} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-medium">Курс: {bid.rate}</div>
                        <div className="text-xs text-gray-500">Заявка #{bid.order_id}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">
                        Ожидает
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Completed Tab */}
        {exchangerTab === 'completed' && (
          <>
            {completedBids.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearArchive} className="w-full">
                <Trash2 size={16} className="mr-2" />
                Очистить архив
              </Button>
            )}

            {completedBids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                Нет завершённых заявок
              </div>
            ) : (
              <div className="space-y-2">
                {completedBids.map((bid: Bid) => (
                  <div key={bid.id} className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                    <div>
                      <div className="font-medium">Курс: {bid.rate}</div>
                      <div className="text-xs text-gray-500">Заявка #{bid.order_id}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${bid.status === 'accepted'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                      }`}>
                      {bid.status === 'accepted' ? '✓ Принято' : '✗ Отклонено'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  }

  // CLIENT VIEW
  const activeClientOrders = myOrders.filter((o: Order) => o.status === 'active');
  const closedClientOrders = myOrders.filter((o: Order) => o.status !== 'active');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-title">{t('myOrders', language) || 'Мои заявки'}</h2>

      {/* Active Orders */}
      {activeClientOrders.length > 0 && (
        <div className="space-y-3">
          {activeClientOrders.map((order) => (
            <div key={order.id} className="border rounded-xl bg-white border-gray-200 overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrder(order.id)}
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {order.amount} {order.currency}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {order.location} • {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">
                    active
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
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('offers', language)} ({orderBids[order.id]?.length || 0})
                      </h4>

                      {loadingBids[order.id] ? (
                        <div className="flex justify-center py-4">
                          <Loader className="animate-spin text-gray-400" size={20} />
                        </div>
                      ) : orderBids[order.id]?.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Пока нет предложений
                        </div>
                      ) : (
                        orderBids[order.id]?.map((bid) => (
                          <div key={bid.id} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">Курс: {bid.rate}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={12} /> {bid.time_estimate || '15'} мин
                                </div>
                              </div>
                              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                                ★ {bid.rating?.toFixed(1) || '5.0'}
                              </span>
                            </div>
                            {bid.comment && (
                              <div className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                                "{bid.comment}"
                              </div>
                            )}
                            {bid.status === 'accepted' ? (
                              <div className="w-full py-2 text-center text-green-600 bg-green-50 rounded-md font-medium text-sm flex items-center justify-center gap-1">
                                <CheckCircle size={14} />
                                Принято
                              </div>
                            ) : (
                              <Button size="sm" className="w-full" onClick={() => handleAcceptBid(bid.id)}>
                                Принять предложение
                              </Button>
                            )}
                          </div>
                        ))
                      )}

                      {/* Cancel button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <X size={16} className="mr-1" />
                        Отменить заявку
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Closed Orders */}
      {closedClientOrders.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-500 mt-4">Завершённые заявки</h3>
          <div className="space-y-2">
            {closedClientOrders.map((order) => (
              <div key={order.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-600">{order.amount} {order.currency}</div>
                  <div className="text-xs text-gray-400">{order.location}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {myOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Archive size={48} className="mx-auto mb-3 opacity-30" />
          {t('noOrders', language) || 'Нет заявок'}
        </div>
      )}
    </motion.div>
  );
}
