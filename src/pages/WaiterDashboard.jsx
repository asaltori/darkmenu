import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle, Clock, PlusCircle, DollarSign, Save, X } from 'lucide-react';

const WaiterDashboard = () => {
  const { 
    orders, 
    updateOrderStatus, 
    updateOrder, 
    getMyRestaurant, 
    tables, 
    restaurantMenu, 
    carritoItems, 
    currentUser,
    updateOrderItemStatus, // Import this!
    updateOrderItemsStatusBatch // Batch action
  } = useStore();
  const myRestaurant = getMyRestaurant();

  const [editingOrder, setEditingOrder] = useState(null); // Order being edited
  const [tipInput, setTipInput] = useState({}); // { orderId: percentage }

  if (!myRestaurant) return <div className="p-10 text-center text-red-500">No tienes restaurante asignado.</div>;

  // Filter orders for MY restaurant
  // Only show pending orders that are NOT yet assigned to a waiter (so any waiter can pick them)
  // OR orders assigned to ME
  const myOrders = orders.filter(o => o.restaurantId === myRestaurant.id);

  const pendingConfirmation = myOrders.filter(o => o.status === 'pendiente_confirmacion' && !o.waiter_id);
  const activeOrders = myOrders.filter(o => 
      ['confirmado', 'en_camino'].includes(o.status) && o.waiter_id === currentUser.id
  );

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
  const handleUpdateItemStatus = (orderId, itemId, status) => {
      // Use the store function if available, or call directly
      // Since updateOrderItemStatus is available in store, we should import it.
      // Wait, let's check if we imported it.
  };

  const handleReceiveItems = async (orderId, orderItems) => {
      // Find items that are 'en_camino' and mark them as 'entregado' (Received at Restaurant)
      const itemsToReceive = orderItems.filter(i => i.status === 'en_camino');
      
      if (itemsToReceive.length === 0) return;

      const itemList = itemsToReceive.map(i => `- ${i.name} (x${i.quantity})`).join('\n');
      if (!window.confirm(`¿Confirmar recepción en restaurante de:\n${itemList}?`)) return;

      const itemIds = itemsToReceive.map(i => i.id);
      await updateOrderItemsStatusBatch(orderId, itemIds, 'entregado');
  };

  const handleDeliverToClient = async (orderId, orderItems) => {
      // Find items that are 'entregado' (at restaurant) and mark as 'entregado_cliente'
      const itemsToDeliver = orderItems.filter(i => i.status === 'entregado');
      
      if (itemsToDeliver.length === 0) return;

      const itemList = itemsToDeliver.map(i => `- ${i.name} (x${i.quantity})`).join('\n');
      if (!window.confirm(`¿Entregar al cliente los siguientes productos:\n${itemList}?`)) return;

      const itemIds = itemsToDeliver.map(i => i.id);
      await updateOrderItemsStatusBatch(orderId, itemIds, 'entregado_cliente');
  };

  const handleConfirm = async (orderId) => {
    // Assign waiter to order when confirming
    // This "takes" the table for this waiter
    await updateOrder(orderId, { 
        status: 'confirmado',
        waiter_id: currentUser.id
    });
    alert('Has tomado esta mesa');
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

  // Group Active Orders by Table
  const ordersByTable = {};
  myOrders.forEach(o => {
      // Consider orders that are assigned to me OR unassigned (if I want to see them all, but let's stick to assigned)
      if (o.waiter_id === currentUser.id && ['confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'entregado_cliente'].includes(o.status)) {
          if (!ordersByTable[o.tableId]) ordersByTable[o.tableId] = [];
          ordersByTable[o.tableId].push(o);
      }
  });

  const handleDispatchOrder = async (orderId) => {
      await updateOrderStatus(orderId, 'en_camino');
  };

  const handleCloseTable = async (tableId) => {
      if (!window.confirm('¿Cobrar y cerrar mesa? Esto marcará todos los pedidos como pagados.')) return;
      
      const tableOrders = ordersByTable[tableId];
      // Process all orders for this table
      for (const order of tableOrders) {
          await updateOrderStatus(order.id, 'pagado');
      }
      alert(`Mesa ${getTableNumber(tableId)} cerrada y cobrada correctamente.`);
  };

  const getStatusBadgeWaiter = (status) => {
      switch(status) {
          case 'confirmado': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'En Cola' };
          case 'pendiente': return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Pendiente' };
          case 'en_preparacion': return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cocinando' };
          case 'listo': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Listo en Cocina' };
          case 'en_camino': return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En Camino' };
          case 'entregado': return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Recibido en Rest.' };
          case 'entregado_cliente': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado a Cliente' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
      }
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-800">{myRestaurant.name} - Panel de Camarero</h1>
          <div className="text-sm text-blue-600 font-medium">Hola, {currentUser.name}</div>
      </div>

      {/* --- PENDING ORDERS (New Requests) --- */}
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
                <span className="text-sm text-gray-500">#{order.id ? String(order.id).slice(0,8) : '...'}</span>
              </div>
              
              <ul className="mb-4 space-y-2 bg-gray-50 p-2 rounded">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between border-b border-gray-200 pb-1 last:border-0">
                    <span>{item.name}</span>
                    <span className="font-bold">x{item.quantity}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleConfirm(order.id)}
                  className="flex-1 bg-green-600 text-white py-3 rounded hover:bg-green-700 flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <CheckCircle size={20} /> Tomar Mesa
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

      {/* --- ACTIVE TABLES (Grouped) --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-600 flex items-center gap-2">
             <Clock /> Mis Mesas Activas
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {Object.keys(ordersByTable).map(tableId => {
                const tableOrders = ordersByTable[tableId];
                // Calculate Total for Table
                const tableTotal = tableOrders.reduce((acc, order) => 
                    acc + order.items.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0), 0
                );
                
                return (
                <div key={tableId} className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-blue-600">
                  <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                      <h3 className="font-bold text-xl text-blue-900">Mesa {getTableNumber(Number(tableId))}</h3>
                      <div className="text-right">
                          <span className="block text-2xl font-bold text-green-600">${tableTotal}</span>
                          <span className="text-xs text-gray-500">{tableOrders.length} orden(es)</span>
                      </div>
                  </div>

                  <div className="p-4 space-y-6">
                      {/* List Orders for this Table */}
                      {tableOrders.map(order => (
                          <div key={order.id} className="border-b pb-4 last:border-0 last:pb-0">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-gray-400">Orden #{order.id ? String(order.id).slice(0,8) : '...'}</span>
                                  <div className="flex items-center gap-2">
                                      {/* Global Order Status Badge */}
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusBadgeWaiter(order.status).bg} ${getStatusBadgeWaiter(order.status).text}`}>
                                          {getStatusBadgeWaiter(order.status).label}
                                      </span>
                                      
                                      {/* NEW: Batch Actions for Waiter based on ITEM statuses */}
                                      
                                      {/* 1. Receive Items (en_camino -> entregado) */}
                                      {/* Show distinct buttons per origin if multiple origins are sending? 
                                          For now, a single "Receive All Incoming" is practical. */}
                                      {(() => {
                                          const count = order.items.filter(i => i.status === 'en_camino').length;
                                          if (count === 0) return null;
                                          return (
                                          <button 
                                              onClick={() => handleReceiveItems(order.id, order.items)}
                                              className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded hover:bg-purple-700 shadow flex items-center gap-1 animate-pulse"
                                          >
                                              <CheckCircle size={10} /> Recibir ({count})
                                          </button>
                                          );
                                      })()}

                                      {/* 2. Deliver Items (entregado -> entregado_cliente) */}
                                      {(() => {
                                          const count = order.items.filter(i => i.status === 'entregado').length;
                                          if (count === 0) return null;
                                          return (
                                          <button 
                                              onClick={() => handleDeliverToClient(order.id, order.items)}
                                              className="bg-green-600 text-white text-[10px] px-2 py-1 rounded hover:bg-green-700 shadow flex items-center gap-1"
                                          >
                                              <CheckCircle size={10} /> Entregar a Mesa ({count})
                                          </button>
                                          );
                                      })()}

                                  </div>
                              </div>
                              {/* Group Items by Origin (Carrito) for clearer tracking */}
                              <div className="space-y-2 mb-2">
                                  {Object.values(order.items.reduce((acc, item) => {
                                      const key = item.carritoId || 'unknown';
                                      if (!acc[key]) acc[key] = [];
                                      acc[key].push(item);
                                      return acc;
                                  }, {})).map((groupItems, gIdx) => (
                                      <div key={gIdx} className="bg-gray-50 p-2 rounded border border-gray-100">
                                          {/* We don't have carrito name easily here without looking up, but items usually grouped logically */}
                                          <ul className="text-sm space-y-1">
                                              {groupItems.map((item, idx) => (
                                                  <li key={idx} className="flex justify-between items-center py-1">
                                                      <div className="flex items-center gap-2">
                                                          {/* Thumbnail */}
                                                          <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                              {item.image ? (
                                                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                              ) : (
                                                                  <span className="text-xs flex items-center justify-center h-full">🍽️</span>
                                                              )}
                                                          </div>
                                                          
                                                          <div className="flex flex-col">
                                                              <span className="font-medium text-sm leading-tight">
                                                                  {item.name} <span className="text-gray-400 font-normal">x{item.quantity}</span>
                                                              </span>
                                                              <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${
                                                                  item.status === 'listo' ? 'bg-blue-100 text-blue-800' :
                                                                  item.status === 'en_preparacion' ? 'bg-yellow-100 text-yellow-800' :
                                                                  item.status === 'pendiente' ? 'bg-gray-100 text-gray-500' :
                                                                  item.status === 'en_camino' ? 'bg-orange-100 text-orange-800' :
                                                                  item.status === 'entregado' ? 'bg-purple-100 text-purple-800' :
                                                                  item.status === 'entregado_cliente' ? 'bg-green-100 text-green-800' :
                                                                  'bg-gray-100 text-gray-800'
                                                              }`}>
                                                                  {item.status === 'entregado' ? 'En Rest.' : 
                                                                   item.status === 'entregado_cliente' ? 'Entregado' : 
                                                                   (item.status || 'pendiente').replace('_', ' ')}
                                                              </span>
                                                          </div>
                                                      </div>
                                                      <span className="font-medium text-sm">${item.sellingPrice * item.quantity}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  ))}
                              </div>
                              
                              {/* Actions per Order */}
                              <div className="flex justify-end gap-2">
                                  {/* Add Items (Only to latest or any? Any is fine) */}
                                  {editingOrder?.id === order.id ? (
                                      <div className="w-full bg-gray-50 p-2 rounded border">
                                          <div className="flex justify-between mb-2">
                                              <span className="text-xs font-bold">Agregar:</span>
                                              <button onClick={() => setEditingOrder(null)}><X size={14}/></button>
                                          </div>
                                          <div className="max-h-32 overflow-y-auto">
                                              {availableMenu.map(item => (
                                                  <button key={item.id} onClick={() => handleAddItemToOrder(item)} className="block w-full text-left text-sm p-1 hover:bg-blue-100">
                                                      {item.name} (${item.sellingPrice})
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  ) : (
                                      <button onClick={() => setEditingOrder(order)} className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                                          <PlusCircle size={12}/> Agregar
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Table Actions Footer */}
                  <div className="bg-gray-100 p-4 border-t flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                          {/* Tip input could be per table or per order. Keeping simple for now */}
                          Total a Pagar
                      </div>
                      <button 
                        onClick={() => handleCloseTable(tableId)}
                        className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-bold flex items-center gap-2"
                      >
                          <DollarSign size={18} /> Cobrar y Cerrar
                      </button>
                  </div>
                </div>
                );
             })}
             {Object.keys(ordersByTable).length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No tienes mesas activas.</p>}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;