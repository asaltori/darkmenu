import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Package, Send, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';

const CarritoDashboard = () => {
  const { currentUser, menuItems, orders, updateDishStatus, updateDishCost, notifyDispatch } = useStore();
  const [editPriceId, setEditPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const myItems = menuItems.filter(item => item.ownerId === currentUser.id);
  
  // Filter orders that contain items from this carrito
  const myOrders = orders.filter(order => 
    order.items.some(orderItem => orderItem.ownerId === currentUser.id) &&
    ['confirmado', 'en_camino'].includes(order.status)
  );

  const handlePriceUpdate = (id) => {
    updateDishCost(id, Number(tempPrice));
    setEditPriceId(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Package /> Gestión de Menú
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">Plato</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Costo ($)</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {myItems.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-gray-600">{item.description}</td>
                  <td className="p-4">
                    {editPriceId === item.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="w-20 border rounded px-2 py-1"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                        />
                        <button 
                          onClick={() => handlePriceUpdate(item.id)}
                          className="text-green-600 font-bold"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono">${item.costPrice}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3">
                    <button 
                      onClick={() => updateDishStatus(item.id, !item.active)}
                      className={`p-1 rounded ${item.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                      title={item.active ? "Desactivar" : "Activar"}
                    >
                      {item.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button 
                      onClick={() => { setEditPriceId(item.id); setTempPrice(item.costPrice); }}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      title="Cambiar Precio"
                    >
                      <DollarSign size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Send /> Pedidos Pendientes de Envío
        </h2>
        {myOrders.length === 0 ? (
          <p className="text-gray-500 italic">No hay pedidos pendientes.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myOrders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Mesa {order.tableId}</span>
                  <span className="text-sm text-gray-500">#{order.id}</span>
                </div>
                <ul className="mb-4 text-sm space-y-1">
                  {order.items
                    .filter(item => item.ownerId === currentUser.id)
                    .map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-bold">x{item.quantity}</span>
                      </li>
                    ))}
                </ul>
                {order.status !== 'en_camino' && (
                  <button 
                    onClick={() => notifyDispatch(order.id)}
                    className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Notificar Envío
                  </button>
                )}
                {order.status === 'en_camino' && (
                  <div className="text-center text-green-600 font-medium bg-green-50 py-2 rounded">
                    En camino
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarritoDashboard;
