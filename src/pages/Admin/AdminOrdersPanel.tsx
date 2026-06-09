import { Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export interface CustomerOrder {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  governorate: string;
  detailed_address: string;
  items: any[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  created_at: string;
}

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Completed'] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string }> = {
  Pending:   { bg: '#fef3c7', color: '#d97706' },
  Confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  Shipped:   { bg: '#ede9fe', color: '#7c3aed' },
  Completed: { bg: '#d1fae5', color: '#065f46' },
};

const nextStatus = (current: string): OrderStatus => {
  const idx = ORDER_STATUSES.indexOf(current as OrderStatus);
  return ORDER_STATUSES[(idx + 1) % ORDER_STATUSES.length];
};

const AdminOrdersPanel = ({
  orders,
  setOrders,
  loadingOrders,
  onRefresh,
}: {
  orders: CustomerOrder[];
  setOrders: React.Dispatch<React.SetStateAction<CustomerOrder[]>>;
  loadingOrders: boolean;
  onRefresh: () => void;
}) => {
  const handleUpdateStatus = async (orderId: number, currentStatus: string) => {
    const next = nextStatus(currentStatus);
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', orderId);
    if (!error) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o));
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`Delete order #${orderId}? This cannot be undone.`)) return;
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (!error) setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <div className="orders-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Real-time Delivery Logs</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Click a status badge to cycle it. Click 🗑 to delete an order.
          </p>
        </div>
        <button
          onClick={onRefresh}
          style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', color: '#475569' }}
        >
          <RefreshCw size={20} style={{ animation: loadingOrders ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Buyer Details</th>
              <th style={{ padding: '1rem' }}>Shipping Address</th>
              <th style={{ padding: '1rem' }}>Items</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const statusStyle = STATUS_STYLES[order.status as OrderStatus] ?? STATUS_STYLES.Pending;
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{order.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{order.customer_name}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customer_email}</span>
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>{order.customer_phone}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '200px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{order.governorate}</span>
                      <span style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', lineHeight: '1.3' }}>{order.detailed_address}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {order.items?.map((item: any, idx: number) => (
                        <span key={idx} style={{ fontSize: '0.8rem', color: '#334155', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                          {item.quantity}x {item.name_en}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 800 }}>{order.total} EGP</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleUpdateStatus(order.id, order.status)}
                      title="Click to advance status"
                      style={{
                        padding: '6px 14px', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {order.status}
                    </button>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      title="Delete this order"
                      style={{
                        background: '#fff0f0', border: '1px solid #fca5a5', color: '#dc2626',
                        borderRadius: '0.375rem', padding: '6px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPanel;