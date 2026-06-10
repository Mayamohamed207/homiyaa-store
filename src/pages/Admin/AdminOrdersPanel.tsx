import React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import './AdminOrdersPanel.css';

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
      <div className="orders-panel-header">
        <div className="orders-panel-title">
          <h2>Real-time Delivery Logs</h2>
          <p>Click a status badge to move its status</p>
        </div>
        <button onClick={onRefresh} className="refresh-logs-btn">
          <RefreshCw size={20} style={{ animation: loadingOrders ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="orders-table-wrapper">
        <table className="orders-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Buyer Details</th>
              <th>Shipping Address</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const statusStyle = STATUS_STYLES[order.status as OrderStatus] ?? STATUS_STYLES.Pending;
              return (
                <tr key={order.id}>
                  <td className="order-id-cell">#{order.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customer_email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customer_phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.governorate}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.detailed_address}</div>
                  </td>
                  <td>
                    <ul className="order-items-list">
                      {(order.items || []).map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.name_en || 'Product'} ({item.colorChosen || 'Default'}) x{item.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.total} EGP</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Delivery: {order.shipping_cost} EGP</div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleUpdateStatus(order.id, order.status)}
                      className="status-update-badge"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {order.status}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteOrder(order.id)} title="Delete this order" className="order-action-delete-btn">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="orders-empty-state">No orders yet.</div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPanel;