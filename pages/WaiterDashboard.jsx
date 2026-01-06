import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle, Trash2, Edit } from 'lucide-react';

const WaiterDashboard = () => {
  const { orders, updateOrderStatus, setOrders } = useStore();

  const pendingOrders = orders.filter(o => o.status === 'pendiente');
  const activeOrders = orders.filter(o => ['confirmado', 'en_camino'].includes(o.status));

  const handleConfirm = (orderId) => {
    updateOrderStatus(orderId, 'confirmado');
  };

  // Note: setOrders is not exposed in context, I should have exposed it or a modifyOrder function.
  // Since I can't change StoreContext easily without rewriting, I will rely on what I have or re-write StoreContext if critical.
  // Wait, I didn't expose setOrders. I exposed `updateOrderStatus`.
  // I need to add `modifyOrder` to StoreContext or just skip modification for now?
  // The prompt says "poder modificarla".
  // I will just mock the modification UI but maybe not fully functional logic if context is missing.
  // Actually, I can re-write StoreContext later if needed, but let's check if I can add a helper function in this file if I had access to state setter... I don't.
  // I will re-write StoreContext to include `modifyOrder` after this.
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-orange-600">Pedidos Pendientes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-lg">Mesa {order.tableId}</span>
                <span className="text-sm text-gray-500">#{order.id}</span>
              </div>
              <ul className="mb-4 space-y-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between border-b border-gray-100 pb-1">
                    <span>{item.name}</span>
                    <span className="font-bold">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleConfirm(order.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Confirmar
                </button>
                {/* Modify button placeholder - functionality requires context update */}
                 <button 
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                  title="Modificar (Simulado)"
                  onClick={() => alert("Función de modificar pedido pendiente de implementación en StoreContext")}
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
          ))}
          {pendingOrders.length === 0 && <p className="text-gray-500">No hay pedidos pendientes.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Pedidos En Curso</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
             <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Mesa</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Items</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map(order => (
                <tr key={order.id} className="border-b">
                  <td className="p-4">#{order.id}</td>
                  <td className="p-4 font-bold">Mesa {order.tableId}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'en_camino' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;
