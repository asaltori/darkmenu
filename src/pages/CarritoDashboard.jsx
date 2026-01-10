import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Package, Send, DollarSign, ToggleLeft, ToggleRight, Clock, PlusCircle, User, MapPin, Save, X } from 'lucide-react';

const CarritoDashboard = () => {
  const { 
    currentUser, 
    carritoItems, 
    orders, 
    updateDish, 
    notifyDispatch, 
    getMyCarrito, 
    updateCarrito,
    createDish,
    restaurants, // Import restaurants to look up names
    tables // Import tables to look up numbers safely
  } = useStore();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'profile'
  const [deliveryTime, setDeliveryTime] = useState('15'); 
  
  // Menu Editing State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({}); // { costPrice, preparationTime, ... }
  
  // New Dish State
  const [showNewDishForm, setShowNewDishForm] = useState(false);
  const [newDish, setNewDish] = useState({ name: '', description: '', costPrice: '', preparationTime: '15' });

  // Profile Editing State
  const [profileForm, setProfileForm] = useState({ name: '', address: '' });

  const myCarrito = getMyCarrito();

  // Initialize Profile Form
  useEffect(() => {
    if (myCarrito) {
        setProfileForm({ name: myCarrito.name, address: myCarrito.address || '' });
    }
  }, [myCarrito]);

  if (!currentUser) return null;

  // Filter Items: Support V5 (carritoId) and Legacy (ownerId)
  const myItems = carritoItems.filter(item => {
      if (myCarrito && item.carritoId === myCarrito.id) return true;
      if (item.ownerId === currentUser.id) return true;
      return false;
  });
  
  // Filter Orders
  const myOrders = orders.filter(order => 
    order.items.some(orderItem => {
        // Check if this order item belongs to me
        // Order items are snapshots, so they might have ownerId. 
        // Ideally we should check if the original menuItemId belongs to me, but snapshot is safer.
        return orderItem.ownerId === currentUser.id || (myCarrito && orderItem.carritoId === myCarrito.id);
    }) &&
    ['confirmado', 'en_camino'].includes(order.status)
  );

  // --- Handlers ---

  const handleUpdateDish = async (id) => {
      await updateDish(id, {
          costPrice: Number(editForm.costPrice),
          preparationTime: Number(editForm.preparationTime)
      });
      setEditingItemId(null);
  };

  const handleCreateDish = async (e) => {
      e.preventDefault();
      if (!myCarrito) return alert("Error: No tienes un perfil de carrito asignado.");
      
      await createDish(myCarrito.id, {
          name: newDish.name,
          description: newDish.description,
          costPrice: Number(newDish.costPrice),
          preparationTime: Number(newDish.preparationTime)
      });
      setShowNewDishForm(false);
      setNewDish({ name: '', description: '', costPrice: '', preparationTime: '15' });
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      if (!myCarrito) return;
      await updateCarrito(myCarrito.id, profileForm);
      alert("Perfil actualizado correctamente");
  };

  const handleDispatch = (orderId) => {
      notifyDispatch(orderId, deliveryTime);
  };

  // Helper to get Restaurant Name and Table Number
  const getDeliveryDetails = (order) => {
      const restaurant = restaurants.find(r => r.id === order.restaurantId);
      const table = tables.find(t => t.id === order.tableId);
      return {
          restaurantName: restaurant ? restaurant.name : 'Restaurante Desconocido',
          tableNumber: table ? table.tableNumber || table.table_number : order.tableId
      };
  };

  if (!myCarrito) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Cuenta no configurada</h2>
              <p>Tu usuario tiene rol de 'Carrito' pero no tiene un perfil de Carrito asignado.</p>
              <p className="text-sm text-gray-500 mt-2">Contacta al administrador para que cree tu ficha de Carrito.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="text-orange-600"/> {myCarrito.name}
                </h1>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                    <MapPin size={14}/> {myCarrito.address || 'Sin dirección'}
                </p>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'orders' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pedidos ({myOrders.length})
                </button>
                <button 
                    onClick={() => setActiveTab('menu')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'menu' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Mi Menú
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'profile' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Perfil
                </button>
            </div>
        </div>

        {/* --- TAB: ORDERS --- */}
        {activeTab === 'orders' && (
            <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Send size={20}/> Pedidos en Cocina
                </h2>
                {myOrders.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed rounded-lg p-10 text-center">
                        <p className="text-gray-500">No hay pedidos pendientes por preparar.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myOrders.map(order => {
                            const isDispatched = order.status === 'en_camino';
                            const { restaurantName, tableNumber } = getDeliveryDetails(order);
                            
                            return (
                                <div key={order.id} className={`p-4 rounded-lg shadow border-l-4 ${isDispatched ? 'bg-gray-50 border-green-500' : 'bg-white border-red-500'}`}>
                                    <div className="flex flex-col mb-2 border-b pb-2">
                                        <span className="font-bold text-lg text-gray-800">{restaurantName}</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-medium text-gray-600">Mesa {tableNumber}</span>
                                            <span className="text-xs text-gray-400">#{order.id}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-orange-50 p-3 rounded mb-3">
                                        <h4 className="font-bold text-xs text-orange-800 uppercase mb-2">A Preparar:</h4>
                                        <ul className="text-sm space-y-2">
                                        {order.items
                                            .filter(item => item.ownerId === currentUser.id || item.carritoId === myCarrito.id)
                                            .map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-start border-b border-orange-100 pb-1 last:border-0">
                                                <div>
                                                    <span className="font-bold block">{item.name}</span>
                                                    {item.preparationTime && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {item.preparationTime}m</span>}
                                                </div>
                                                <span className="bg-orange-200 text-orange-800 px-2 rounded-full text-xs font-bold">x{item.quantity}</span>
                                            </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {!isDispatched ? (
                                        <div className="mt-4 pt-3 border-t">
                                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mb-2 font-medium">
                                                📍 Entregar en: {restaurantName}, Mesa {tableNumber}
                                            </div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Tiempo estimado entrega:
                                            </label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number" 
                                                    className="w-16 border rounded px-2 py-1 text-sm text-center"
                                                    value={deliveryTime}
                                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                                />
                                                <button 
                                                    onClick={() => handleDispatch(order.id)}
                                                    className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-bold shadow"
                                                >
                                                    <Send size={14} /> Despachar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-green-700 font-bold bg-green-100 py-2 rounded mt-2 border border-green-200 text-sm">
                                            ✅ Enviado ({order.deliveryTime} mins)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: MENU --- */}
        {activeTab === 'menu' && (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Gestión de Productos</h2>
                    <button 
                        onClick={() => setShowNewDishForm(!showNewDishForm)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm font-bold"
                    >
                        <PlusCircle size={18}/> {showNewDishForm ? 'Cancelar' : 'Nuevo Plato'}
                    </button>
                </div>

                {showNewDishForm && (
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-green-100 mb-6 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold mb-4 text-green-800">Agregar Nuevo Producto</h3>
                        <form onSubmit={handleCreateDish} className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Plato</label>
                                <input required className="w-full border p-2 rounded" value={newDish.name} onChange={e => setNewDish({...newDish, name: e.target.value})} placeholder="Ej: Tacos al Pastor" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                <textarea className="w-full border p-2 rounded" value={newDish.description} onChange={e => setNewDish({...newDish, description: e.target.value})} placeholder="Ingredientes, detalles..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Base ($)</label>
                                <input required type="number" className="w-full border p-2 rounded" value={newDish.costPrice} onChange={e => setNewDish({...newDish, costPrice: e.target.value})} placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiempo Prep. (mins)</label>
                                <input required type="number" className="w-full border p-2 rounded" value={newDish.preparationTime} onChange={e => setNewDish({...newDish, preparationTime: e.target.value})} placeholder="15" />
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Guardar Producto</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Plato</th>
                                <th className="p-4">Costo ($)</th>
                                <th className="p-4">Tiempo (min)</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {myItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                                    </td>
                                    <td className="p-4">
                                        {editingItemId === item.id ? (
                                            <input 
                                                type="number" 
                                                className="w-20 border rounded px-1 py-1 text-sm"
                                                value={editForm.costPrice}
                                                onChange={e => setEditForm({...editForm, costPrice: e.target.value})}
                                            />
                                        ) : (
                                            <span className="text-green-600 font-mono font-bold">${item.costPrice}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingItemId === item.id ? (
                                            <input 
                                                type="number" 
                                                className="w-16 border rounded px-1 py-1 text-sm"
                                                value={editForm.preparationTime}
                                                onChange={e => setEditForm({...editForm, preparationTime: e.target.value})}
                                            />
                                        ) : (
                                            <span className="text-gray-600 flex items-center gap-1 text-sm"><Clock size={14}/> {item.preparationTime || 15}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => updateDish(item.id, { active: !item.active })}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${item.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                        >
                                            {item.active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        {editingItemId === item.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleUpdateDish(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={18}/></button>
                                                <button onClick={() => setEditingItemId(null)} className="text-gray-400 hover:bg-gray-50 p-1 rounded"><X size={18}/></button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setEditingItemId(item.id);
                                                    setEditForm({ costPrice: item.costPrice, preparationTime: item.preparationTime || 15 });
                                                }}
                                                className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {myItems.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No tienes productos en tu menú. Agrega uno nuevo.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB: PROFILE --- */}
        {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                        <User /> Configuración del Carrito
                    </h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Carrito</label>
                            <input 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" 
                                value={profileForm.name} 
                                onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Dirección / Ubicación</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    className="w-full border p-2 pl-10 rounded focus:ring-2 focus:ring-orange-500 outline-none" 
                                    value={profileForm.address} 
                                    onChange={e => setProfileForm({...profileForm, address: e.target.value})} 
                                    placeholder="Ej: Av. Principal 123"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Esta dirección será visible para los restaurantes y administradores.</p>
                        </div>
                        <div className="pt-4">
                            <button className="w-full bg-orange-600 text-white font-bold py-2 rounded hover:bg-orange-700 shadow transition">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default CarritoDashboard;