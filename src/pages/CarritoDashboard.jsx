import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Package, Send, DollarSign, ToggleLeft, ToggleRight, Clock, PlusCircle, User, MapPin, Save, X, TrendingUp, ShoppingBag, Store, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    tables, // Import tables to look up numbers safely
    updateOrderStatus,
    updateOrderItemStatus, // New action
    updateOrderItemsStatusBatch, // Batch action
    categories, // Import categories
    ingredients, // Import ingredients
    menuItemIngredients, // Import links
    createIngredient,
    deleteIngredient,
    linkIngredientToDish,
    unlinkIngredientFromDish
  } = useStore();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'profile' | 'analytics' | 'ingredients'
  const [deliveryTime, setDeliveryTime] = useState('15'); 
  const [historyLimit, setHistoryLimit] = useState(10); 
  
  // Menu Editing State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({}); // { costPrice, preparationTime, categoryId... }
  const [editingIngredientsId, setEditingIngredientsId] = useState(null); // Which dish we are editing ingredients for
  const [ingredientFilter, setIngredientFilter] = useState(''); // Filter text for ingredients

  // New Dish State
  const [showNewDishForm, setShowNewDishForm] = useState(false);
  const [newDish, setNewDish] = useState({ 
      name: '', 
      description: '', 
      costPrice: '', 
      preparationTime: '15', 
      categoryId: '',
      dietaryTags: [] // Array of selected tags
  });

  const availableTags = [
      { id: 'veggie', label: 'Vegetariano', icon: '🥗' },
      { id: 'vegan', label: 'Vegano', icon: '🌱' },
      { id: 'gluten_free', label: 'Sin Gluten', icon: '🌾' },
      { id: 'spicy', label: 'Picante', icon: '🌶️' },
      { id: 'sugar_free', label: 'Sin Azúcar', icon: '🍬' }
  ];

  // Ingredient Management State
  const [newIngredientName, setNewIngredientName] = useState('');

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
        return orderItem.ownerId === currentUser.id || (myCarrito && orderItem.carritoId === myCarrito.id);
    }) &&
    ['confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado'].includes(order.status)
  ).sort((a, b) => {
      // Sort by status priority then date
      const statusOrder = { 'confirmado': 1, 'en_preparacion': 2, 'listo': 3, 'en_camino': 4, 'entregado': 5 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return new Date(b.created_at) - new Date(a.created_at);
  });

  // --- ANALYTICS ---
  const allCompletedOrders = orders.filter(o => ['pagado', 'entregado'].includes(o.status));
  
  // Flatten to get only my sold items
  const mySoldItems = [];
  allCompletedOrders.forEach(order => {
      order.items.forEach(item => {
          if (item.ownerId === currentUser.id || (myCarrito && item.carritoId === myCarrito.id)) {
              mySoldItems.push({ ...item, restaurantId: order.restaurantId, orderDate: order.created_at });
          }
      });
  });

  const totalRevenue = mySoldItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const totalItemsSold = mySoldItems.reduce((sum, item) => sum + item.quantity, 0);

  // Sales by Restaurant
  const salesByRestaurant = restaurants.map(r => {
      const itemsSoldHere = mySoldItems.filter(i => i.restaurantId === r.id);
      const total = itemsSoldHere.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0);
      return { name: r.name, sales: total };
  }).filter(r => r.sales > 0).sort((a, b) => b.sales - a.sales);

  // Top Products
  const productSales = {};
  mySoldItems.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = 0;
      productSales[item.name] += item.quantity;
  });
  const topProducts = Object.keys(productSales)
      .map(name => ({ name, quantity: productSales[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

  // --- Handlers ---
  const handleUpdateItemStatus = (orderId, itemId, status) => {
      updateOrderItemStatus(orderId, itemId, status);
  };

  const handleDispatchMyItems = async (orderId, orderItems) => {
      // Find all my items in this order that are ready to be dispatched
      // Filter items belonging to me and status is 'listo'
      const itemsToDispatch = orderItems.filter(item => {
          const isMine = item.ownerId === currentUser.id || (myCarrito && item.carritoId === myCarrito.id);
          // Allow dispatching if status is 'listo'
          // AND we only want to dispatch items that are ready.
          return isMine && item.status === 'listo';
      });

      if (itemsToDispatch.length === 0) return alert("No tienes items listos para despachar.");

      // Check if ALL my items in this order are ready?
      // Requirement: "el despacho desde el carrito se hace solo si la oreden esta lista completa"
      // Assuming this means "all MY items for this order are ready".
      // Let's check if there are any of MY items that are NOT ready (e.g. 'pendiente' or 'en_preparacion')
      const myItemsInOrder = orderItems.filter(item => 
          item.ownerId === currentUser.id || (myCarrito && item.carritoId === myCarrito.id)
      );
      
      const notReadyItems = myItemsInOrder.filter(item => item.status === 'pendiente' || item.status === 'en_preparacion');

      if (notReadyItems.length > 0) {
          return alert(`No puedes despachar aún. Tienes ${notReadyItems.length} productos pendientes de terminar en esta orden.`);
      }

      // Dispatch ALL my items at once
      const itemList = itemsToDispatch.map(i => `- ${i.name} (x${i.quantity})`).join('\n');
      if (!window.confirm(`¿Estás seguro de despachar los siguientes productos hacia el restaurante?\n${itemList}`)) return;

      const itemIds = itemsToDispatch.map(i => i.id);
      await updateOrderItemsStatusBatch(orderId, itemIds, 'en_camino');
      
      // alert(`Se han despachado todos tus productos (${itemsToDispatch.length}) hacia el restaurante.`);
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'confirmado': return { bg: 'bg-red-100', text: 'text-red-800', label: 'Nuevo Pedido' };
          case 'pendiente': return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Pendiente' };
          case 'en_preparacion': return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cocinando' };
          case 'listo': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Listo para Despacho' };
          case 'en_camino': return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En Camino a Rest.' };
          case 'entregado': return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Restaurante' };
          case 'entregado_cliente': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado a Cliente' };
          default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
      }
  };
  const handleUpdateDish = async (id) => {
      await updateDish(id, {
          costPrice: Number(editForm.costPrice),
          preparationTime: Number(editForm.preparationTime),
          categoryId: editForm.categoryId ? Number(editForm.categoryId) : null
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
          preparationTime: Number(newDish.preparationTime),
          categoryId: newDish.categoryId ? Number(newDish.categoryId) : null,
          dietaryTags: newDish.dietaryTags
      });
      setShowNewDishForm(false);
      setNewDish({ name: '', description: '', costPrice: '', preparationTime: '15', categoryId: '', dietaryTags: [] });
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      if (!myCarrito) return;
      await updateCarrito(myCarrito.id, profileForm);
      alert("Perfil actualizado correctamente");
  };



  const handleCreateIngredient = async (e) => {
      e.preventDefault();
      const normalizedName = newIngredientName.trim();
      if (!normalizedName) return;

      // Check for duplicates (case insensitive)
      const isDuplicate = ingredients.some(i => i.name.toLowerCase() === normalizedName.toLowerCase());
      if (isDuplicate) {
          alert('Este ingrediente ya existe.');
          return;
      }

      // Global ingredients don't belong to a specific carrito_id, they are shared
      // We pass null as carritoId to indicate it's global
      await createIngredient(null, normalizedName);
      setNewIngredientName('');
  };

  const handleToggleIngredientOnDish = async (dishId, ingredientId) => {
      // Check if linked
      const link = menuItemIngredients.find(l => l.menuItemId === dishId && l.ingredientId === ingredientId);
      if (link) {
          await unlinkIngredientFromDish(link.id);
      } else {
          await linkIngredientToDish(dishId, ingredientId);
      }
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
                    onClick={() => setActiveTab('ingredients')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'ingredients' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ingredientes
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'profile' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Perfil
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'analytics' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Analítica
                </button>
            </div>
        </div>

        {/* --- TAB: ORDERS --- */}
        {activeTab === 'orders' && (
            <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Send size={20}/> Gestión de Pedidos
                </h2>
                {myOrders.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed rounded-lg p-10 text-center">
                        <p className="text-gray-500">No hay pedidos activos ni historial reciente.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myOrders.map(order => {
                            const badge = getStatusBadge(order.status);
                            const { restaurantName, tableNumber } = getDeliveryDetails(order);
                            const isHistory = order.status === 'entregado';
                            
                            return (
                                <div key={order.id} className={`p-4 rounded-lg shadow border-l-4 ${isHistory ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-orange-500'}`}>
                                    <div className="flex flex-col mb-2 border-b pb-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-lg text-gray-800 leading-tight">{restaurantName}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-medium text-gray-600">Mesa {tableNumber}</span>
                                            <span className="text-xs text-gray-400">#{String(order.id).slice(0,8)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-orange-50 p-3 rounded mb-3">
                                        <h4 className="font-bold text-xs text-orange-800 uppercase mb-2">Mis Productos:</h4>
                                        <ul className="text-sm space-y-2">
                                        {order.items
                                            .filter(item => item.ownerId === currentUser.id || item.carritoId === myCarrito.id)
                                            .map((item, idx) => {
                                                const itemStatus = item.status || 'pendiente';
                                                const badge = getStatusBadge(itemStatus);
                                                
                                                return (
                                                <li key={idx} className="flex flex-col gap-2 border-b border-orange-100 pb-2 last:border-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="font-bold block">{item.name}</span>
                                                            {item.preparationTime && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {item.preparationTime}m</span>}
                                                        </div>
                                                        <span className="bg-orange-200 text-orange-800 px-2 rounded-full text-xs font-bold">x{item.quantity}</span>
                                                    </div>
                                                    
                                                    {/* Item Control Actions */}
                                                    <div className="flex justify-between items-center bg-white p-1 rounded border border-orange-100">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${badge.bg} ${badge.text}`}>
                                                            {badge.label}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            {itemStatus === 'pendiente' && (
                                                                <button onClick={() => handleUpdateItemStatus(order.id, item.id, 'en_preparacion')} className="p-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200" title="Empezar a cocinar">
                                                                    <Clock size={14}/>
                                                                </button>
                                                            )}
                                                            {itemStatus === 'en_preparacion' && (
                                                                <button onClick={() => handleUpdateItemStatus(order.id, item.id, 'listo')} className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Marcar Listo">
                                                                    <Check size={14}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    {/* Dispatch Button for My Ready Items */}
                                    <div className="mt-4 pt-3 border-t">
                                        {order.items.some(i => (i.ownerId === currentUser.id || i.carritoId === myCarrito.id) && i.status === 'listo') && (
                                            <div className="bg-blue-50 p-2 rounded mb-2">
                                                <p className="text-xs text-blue-800 mb-2 text-center">Tienes productos listos para enviar al restaurante.</p>
                                                <button 
                                                    onClick={() => handleDispatchMyItems(order.id, order.items)}
                                                    className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 font-bold text-sm shadow flex items-center justify-center gap-2"
                                                >
                                                    <Send size={16} /> Despachar hacia Restaurante
                                                </button>
                                            </div>
                                        )}
                                        
                                        <div className="text-center text-xs text-gray-500 mt-2">
                                            <p>Estado Global: <span className="font-bold">{order.status.replace('_', ' ')}</span></p>
                                        </div>
                                    </div>
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
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                <select 
                                    className="w-full border p-2 rounded" 
                                    value={newDish.categoryId} 
                                    onChange={e => setNewDish({...newDish, categoryId: e.target.value})}
                                >
                                    <option value="">Sin Categoría</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiempo Prep. (mins)</label>
                                <input required type="number" className="w-full border p-2 rounded" value={newDish.preparationTime} onChange={e => setNewDish({...newDish, preparationTime: e.target.value})} placeholder="15" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Imagen</label>
                                <input className="w-full border p-2 rounded" value={newDish.image || ''} onChange={e => setNewDish({...newDish, image: e.target.value})} placeholder="https://..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Etiquetas Dietéticas</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.map(tag => {
                                        const isSelected = newDish.dietaryTags.includes(tag.id);
                                        return (
                                            <button
                                                type="button"
                                                key={tag.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setNewDish({...newDish, dietaryTags: newDish.dietaryTags.filter(t => t !== tag.id)});
                                                    } else {
                                                        setNewDish({...newDish, dietaryTags: [...newDish.dietaryTags, tag.id]});
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 transition ${isSelected ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}
                                            >
                                                <span>{tag.icon}</span> {tag.label}
                                            </button>
                                        );
                                    })}
                                </div>
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
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Costo ($)</th>
                                <th className="p-4">Tiempo (min)</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {myItems.map(item => (
                                <React.Fragment key={item.id}>
                                <tr className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                                        
                                        {/* Tags */}
                                        {item.dietaryTags && item.dietaryTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                                {item.dietaryTags.map(tagId => {
                                                    const tag = availableTags.find(t => t.id === tagId);
                                                    if (!tag) return null;
                                                    return (
                                                        <span key={tagId} title={tag.label} className="text-xs bg-green-50 text-green-700 px-1 rounded border border-green-100 cursor-help">
                                                            {tag.icon}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Show ingredients summary */}
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {menuItemIngredients
                                                .filter(l => l.menuItemId === item.id)
                                                .map(l => {
                                                    const ing = ingredients.find(i => i.id === l.ingredientId);
                                                    return ing ? <span key={l.id} className="text-[10px] bg-yellow-50 text-yellow-700 px-1 rounded border border-yellow-100">{ing.name}</span> : null;
                                                })
                                            }
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {editingItemId === item.id ? (
                                            <select 
                                                className="w-full border rounded px-1 py-1 text-sm"
                                                value={editForm.categoryId || ''}
                                                onChange={e => setEditForm({...editForm, categoryId: e.target.value})}
                                            >
                                                <option value="">-</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        ) : (
                                            <span className="text-sm text-gray-600">
                                                {categories.find(c => c.id === item.categoryId)?.name || '-'}
                                            </span>
                                        )}
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
                                                <button onClick={() => setEditingIngredientsId(editingIngredientsId === item.id ? null : item.id)} className={`p-1 rounded ${editingIngredientsId === item.id ? 'bg-yellow-200 text-yellow-800' : 'text-yellow-600 hover:bg-yellow-50'}`} title="Editar Ingredientes"><PlusCircle size={18}/></button>
                                                <button onClick={() => handleUpdateDish(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={18}/></button>
                                                <button onClick={() => { setEditingItemId(null); setEditingIngredientsId(null); }} className="text-gray-400 hover:bg-gray-50 p-1 rounded"><X size={18}/></button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setEditingItemId(item.id);
                                                    setEditForm({ costPrice: item.costPrice, preparationTime: item.preparationTime || 15, categoryId: item.categoryId });
                                                }}
                                                className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {editingIngredientsId === item.id && (
                                    <tr key={`${item.id}-ingredients`} className="bg-yellow-50">
                                        <td colSpan="6" className="p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-xs font-bold text-yellow-800 uppercase">Seleccionar Ingredientes:</h4>
                                                <input 
                                                    type="text" 
                                                    placeholder="Buscar ingrediente..." 
                                                    className="text-xs border p-1 rounded w-40"
                                                    value={ingredientFilter}
                                                    onChange={(e) => setIngredientFilter(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto">
                                                {ingredients
                                                    .filter(ing => ing.name.toLowerCase().includes(ingredientFilter.toLowerCase()))
                                                    .map(ing => {
                                                    const isLinked = menuItemIngredients.some(l => l.menuItemId === item.id && l.ingredientId === ing.id);
                                                    return (
                                                        <label key={ing.id} className={`flex items-center gap-2 px-2 py-1 rounded border cursor-pointer transition ${isLinked ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200 hover:border-yellow-200'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isLinked}
                                                                onChange={() => handleToggleIngredientOnDish(item.id, ing.id)}
                                                                className="rounded text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{ing.name}</span>
                                                        </label>
                                                    );
                                                })}
                                                {ingredients.length === 0 && (
                                                    <p className="text-xs text-gray-500">No hay ingredientes. Ve a la pestaña "Ingredientes" para crear algunos.</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                            ))}
                            {myItems.length === 0 && (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No tienes productos en tu menú. Agrega uno nuevo.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB: INGREDIENTS --- */}
        {activeTab === 'ingredients' && (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="font-bold text-lg mb-4">Biblioteca de Ingredientes</h3>
                    <p className="text-sm text-gray-500 mb-4">Crea ingredientes (ej: "Queso", "Tomate", "Salsa Picante") para que los clientes puedan personalizar sus pedidos.</p>
                    
                    <form onSubmit={handleCreateIngredient} className="flex gap-2 mb-6">
                        <input 
                            className="flex-1 border p-2 rounded"
                            placeholder="Nombre del ingrediente..."
                            value={newIngredientName}
                            onChange={e => setNewIngredientName(e.target.value)}
                        />
                        <button className="bg-green-600 text-white px-4 py-2 rounded font-bold">Crear</button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {ingredients.map(ing => (
                            <div key={ing.id} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
                                <span>{ing.name}</span>
                                <button onClick={() => deleteIngredient(ing.id)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                            </div>
                        ))}
                        {ingredients.length === 0 && (
                            <p className="text-gray-400 italic">No hay ingredientes creados.</p>
                        )}
                    </div>
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
        {/* --- TAB: ANALYTICS --- */}
        {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <div className="flex items-center gap-3 mb-2 text-green-600"><DollarSign /> <span className="font-bold">Ingresos Totales</span></div>
                        <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">Generados en ventas de mis productos</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="flex items-center gap-3 mb-2 text-blue-600"><ShoppingBag /> <span className="font-bold">Items Vendidos</span></div>
                        <p className="text-3xl font-bold">{totalItemsSold}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <div className="flex items-center gap-3 mb-2 text-purple-600"><Store /> <span className="font-bold">Restaurantes Clientes</span></div>
                        <p className="text-3xl font-bold">{salesByRestaurant.length}</p>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Sales by Restaurant Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-6 text-gray-700">Ventas por Restaurante</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={salesByRestaurant}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip formatter={(value) => `$${value}`} />
                                   <Bar dataKey="sales" fill="#8884d8" name="Ventas ($)" radius={[4, 4, 0, 0]} />
                               </BarChart>
                           </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">Dónde se venden más mis productos</p>
                    </div>

                    {/* Top Products Table */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-4 text-gray-700">Mis Productos Top</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                               <thead className="bg-gray-100 text-gray-600">
                                   <tr>
                                       <th className="p-4 rounded-tl-lg">Producto</th>
                                       <th className="p-4 text-right rounded-tr-lg">Unidades</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {topProducts.map((item, idx) => (
                                       <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                           <td className="p-4 font-medium">{item.name}</td>
                                           <td className="p-4 text-right font-bold text-blue-600">{item.quantity}</td>
                                       </tr>
                                   ))}
                                   {topProducts.length === 0 && (
                                       <tr>
                                           <td colSpan="2" className="p-8 text-center text-gray-500">No hay datos de ventas aún.</td>
                                       </tr>
                                   )}
                               </tbody>
                           </table>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CarritoDashboard;