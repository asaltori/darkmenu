import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { DollarSign, ChefHat, Activity } from 'lucide-react';

const RestaurantDashboard = () => {
  const { menuItems, orders, updateSellingPrice, users } = useStore();
  const [editPriceId, setEditPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const handlePriceUpdate = (id) => {
    updateSellingPrice(id, Number(tempPrice));
    setEditPriceId(null);
  };

  const getOwnerName = (id) => {
    return users.find(u => u.id === id)?.name || 'Desconocido';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <DollarSign /> Gestión de Precios de Venta
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">Plato</th>
                <th className="p-4">Proveedor</th>
                <th className="p-4">Costo ($)</th>
                <th className="p-4">Venta ($)</th>
                <th className="p-4">Margen</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-sm text-gray-600">{getOwnerName(item.ownerId)}</td>
                  <td className="p-4 text-red-600">${item.costPrice}</td>
                  <td className="p-4 text-green-600 font-bold">
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
                      <span>${item.sellingPrice}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {((item.sellingPrice - item.costPrice) / item.sellingPrice * 100).toFixed(1)}%
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => { setEditPriceId(item.id); setTempPrice(item.sellingPrice); }}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      title="Editar Precio Venta"
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
          <Activity /> Actividad Reciente (Envíos)
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
            {orders.filter(o => o.status === 'en_camino').length === 0 ? (
                <p className="text-gray-500">No hay envíos en curso.</p>
            ) : (
                <ul className="space-y-3">
                    {orders.filter(o => o.status === 'en_camino').map(order => (
                        <li key={order.id} className="border-b pb-2">
                            <span className="font-bold">Mesa {order.tableId}</span> - Pedido #{order.id} está en camino.
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
