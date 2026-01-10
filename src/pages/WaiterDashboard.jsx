import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle, Clock, PlusCircle, DollarSign, Save, X } from 'lucide-react';

const WaiterDashboard = () => {
  const { orders, updateOrderStatus, updateOrder, getMyRestaurant, tables, restaurantMenu, carritoItems, currentUser } = useStore();
  const myRestaurant = getMyRestaurant();

  const [editingOrder, setEditingOrder] = useState(null); // Order being edited
  const [tipInput, setTipInput] = useState({}); // { orderId: percentage }

  if (!myRestaurant) return <div className="p-10 text-center text-red-500">No tienes restaurante asignado.</div>;

  // Filter orders for MY restaurant
  const myOrders = orders.filter(o => o.restaurantId === myRestaurant.id);

  const pendingConfirmation = myOrders.filter(o => o.status === 'pendiente_confirmacion');
  const activeOrders = myOrders.filter(o => ['confirmado', 'en_camino'].includes(o.status));

  // --- Helpers ---
  const getTableNumber = (id) => tables.find(t => t.id === id)?.table_number || id;
  
  // Get available menu items for adding to orders
  const availableMenu = restaurantMenu
    .filter(rm => rm.restaurantId === myRestaurant.id && rm.active)
    .map(rm => {
        const original = carritoItems.find(ci => ci.id === rm.menuItemId);
        if (!original) return null;
        return { ...original, sellingPrice: rm.sellingPrice, menuLinkId: rm.id };
    })
    .filter(Boolean);

  // --- Handlers ---

  const handleConfirm = async (orderId) => {
    // Assign waiter to order when confirming
    await updateOrder(orderId, { 
        status: 'confirmado',
        waiter_id: currentUser.id
    });
  };

  const handleUpdateTip = async (orderId) => {
      const tip = tipInput[orderId];
      if (tip === undefined || tip < 0) return;
      await updateOrder(orderId, { tip_percentage: Number(tip) });
      alert('Propina actualizada');
  };

  const handleAddItemToOrder = async (item) => {
      if (!editingOrder) return;
      const updatedItems = [...editingOrder.items, {
          ...item,
          quantity: 1,
          menuLinkId: item.menuLinkId
      }];
      
      // Update local state immediately for UI responsiveness
      setEditingOrder({ ...editingOrder, items: updatedItems });
      
      // Persist
      await updateOrder(editingOrder.id, { items: updatedItems });
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-800">{myRestaurant.name} - Panel de Camarero</h1>
          <div className="text-sm text-blue-600 font-medium">Hola, {currentUser.name}</div>
      </div>

      {/* --- PENDING ORDERS --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-orange-600">
            <span className="bg-orange-100 p-1 rounded mr-2">🔔</span>
            Solicitudes Nuevas
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingConfirmation.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400 animate-pulse-slow">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-lg">Mesa {getTableNumber(order.tableId)}</span>
                <span className="text-sm text-gray-500">#{order.id}</span>
              </div>
              
              {/* Items List */}
              <ul className="mb-4 space-y-2 bg-gray-50 p-2 rounded">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between border-b border-gray-200 pb-1 last:border-0">
                    <span>{item.name}</span>
                    <span className="font-bold">x{item.quantity}</span>
                  </li>
                ))}
              </ul>

              {/* Edit Mode for Adding Items */}
              {editingOrder?.id === order.id ? (
                  <div className="mb-4 border p-2 rounded bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-xs uppercase">Agregar Producto:</span>
                          <button onClick={() => setEditingOrder(null)}><X size={16}/></button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                          {availableMenu.map(item => (
                              <button 
                                key={item.id}
                                onClick={() => handleAddItemToOrder(item)}
                                className="w-full text-left text-sm p-1 hover:bg-blue-100 rounded flex justify-between"
                              >
                                  <span>{item.name}</span>
                                  <span className="font-bold">${item.sellingPrice}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              ) : (
                  <button 
                    onClick={() => setEditingOrder(order)}
                    className="w-full mb-2 text-blue-600 text-sm hover:underline flex items-center justify-center gap-1"
                  >
                      <PlusCircle size={14}/> Agregar Productos
                  </button>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => handleConfirm(order.id)}
                  className="flex-1 bg-green-600 text-white py-3 rounded hover:bg-green-700 flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <CheckCircle size={20} /> Confirmar Pedido
                </button>
              </div>
            </div>
          ))}
          {pendingConfirmation.length === 0 && (
            <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No hay solicitudes nuevas.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ACTIVE ORDERS --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-600 flex items-center gap-2">
             <Clock /> Seguimiento y Propinas
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
             <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">Mesa</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Total</th>
                <th className="p-4">Propina (%)</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map(order => {
                const total = order.items.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0);
                const tipAmount = total * ((order.tip_percentage || 0) / 100);
                
                return (
                <tr key={order.id} className="border-b">
                  <td className="p-4 font-bold">Mesa {getTableNumber(order.tableId)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${order.status === 'en_camino' ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                      {order.status === 'en_camino' ? 'En Camino' : 'En Preparación'}
                    </span>
                  </td>
                  <td className="p-4 font-mono">
                      ${total + tipAmount} <span className="text-xs text-gray-400">(${total} + ${tipAmount})</span>
                  </td>
                  <td className="p-4">
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              className="w-16 border rounded px-1 py-1 text-sm"
                              placeholder={order.tip_percentage || 0}
                              onChange={(e) => setTipInput({...tipInput, [order.id]: e.target.value})}
                          />
                          <span className="text-gray-500">%</span>
                      </div>
                  </td>
                  <td className="p-4">
                      <button 
                        onClick={() => handleUpdateTip(order.id)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        title="Guardar Propina"
                      >
                          <Save size={18}/>
                      </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;