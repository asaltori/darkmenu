import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Users, FileText, Settings, Plus, MapPin, DollarSign, ShoppingBag, TrendingUp, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { restaurants, tables, users, carritos, categories, createRestaurant, createCarrito, createCategory, deleteCategory, orders, updateRestaurant, updateCarrito } = useStore();
  const [activeTab, setActiveTab] = useState('management'); // 'management' | 'restaurants' | 'carritos' | 'categories'
  const [analyticsFilterRest, setAnalyticsFilterRest] = useState('all');
  const [analyticsFilterCarrito, setAnalyticsFilterCarrito] = useState('all');
  
  // Create Restaurant State
  const [newRestName, setNewRestName] = useState('');
  const [newRestOwner, setNewRestOwner] = useState('');
  
  // Create Carrito State
  const [newCarritoName, setNewCarritoName] = useState('');
  const [newCarritoOwner, setNewCarritoOwner] = useState('');
  const [newCarritoAddress, setNewCarritoAddress] = useState('');

  // Create Category State
  const [newCatName, setNewCatName] = useState('');

  // Editing State
  const [editingRestId, setEditingRestId] = useState(null);
  const [editRestForm, setEditRestForm] = useState({ name: '', owner_user_id: '' });

  const [editingCarritoId, setEditingCarritoId] = useState(null);
  const [editCarritoForm, setEditCarritoForm] = useState({ name: '', owner_user_id: '', address: '' });

  // Filtered lists
  const restaurantUsers = users.filter(u => u.role === 'restaurant');
  const carritoUsers = users.filter(u => u.role === 'carrito');

  // --- ANALYTICS CALCULATIONS ---
  // Filter orders based on selection
  const filteredOrders = orders.filter(o => {
      // Filter by Restaurant
      if (analyticsFilterRest !== 'all' && o.restaurantId !== Number(analyticsFilterRest)) return false;
      
      // Filter by Carrito (Must contain at least one item from selected carrito)
      if (analyticsFilterCarrito !== 'all') {
          const hasItemFromCarrito = o.items.some(i => i.carritoId === Number(analyticsFilterCarrito));
          if (!hasItemFromCarrito) return false;
      }
      return true;
  });

  const completedOrders = filteredOrders.filter(o => ['pagado', 'entregado'].includes(o.status));
  const activeOrders = filteredOrders.filter(o => !['pagado', 'entregado', 'cancelado'].includes(o.status));
  
  // Calculate totals strictly based on filtered items if carrito filter is active
  // If Carrito is selected, we only sum sales of items belonging to that carrito in the matching orders
  const totalSales = completedOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, i) => {
          if (analyticsFilterCarrito !== 'all' && i.carritoId !== Number(analyticsFilterCarrito)) return s;
          return s + (i.sellingPrice * i.quantity);
      }, 0);
  }, 0);

  // Sales by Restaurant (Chart)
  const salesByRestaurant = restaurants
    .filter(r => analyticsFilterRest === 'all' || r.id === Number(analyticsFilterRest))
    .map(r => {
      const restOrders = completedOrders.filter(o => o.restaurantId === r.id);
      const total = restOrders.reduce((sum, o) => {
          return sum + o.items.reduce((s, i) => {
            if (analyticsFilterCarrito !== 'all' && i.carritoId !== Number(analyticsFilterCarrito)) return s;
            return s + (i.sellingPrice * i.quantity);
          }, 0);
      }, 0);
      return { name: r.name, sales: total };
  }).sort((a, b) => b.sales - a.sales);

  // Sales by Carrito (Chart)
  const salesByCarrito = carritos
    .filter(c => analyticsFilterCarrito === 'all' || c.id === Number(analyticsFilterCarrito))
    .map(c => {
      let total = 0;
      completedOrders.forEach(o => {
          if (analyticsFilterRest !== 'all' && o.restaurantId !== Number(analyticsFilterRest)) return;
          o.items.forEach(item => {
              if (item.carritoId === c.id) {
                  total += item.sellingPrice * item.quantity;
              }
          });
      });
      return { name: c.name, sales: total };
  }).sort((a, b) => b.sales - a.sales);

  // Top Selling Items (Filtered)
  const itemSales = {};
  completedOrders.forEach(o => {
      o.items.forEach(item => {
          if (analyticsFilterCarrito !== 'all' && item.carritoId !== Number(analyticsFilterCarrito)) return;
          if (!itemSales[item.name]) itemSales[item.name] = 0;
          itemSales[item.name] += item.quantity;
      });
  });
  const topItems = Object.keys(itemSales)
      .map(name => ({ name, quantity: itemSales[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

  const handleCreateRestaurant = async (e) => {
      e.preventDefault();
      await createRestaurant(newRestName, newRestOwner);
      setNewRestName('');
      setNewRestOwner('');
      alert('Restaurante creado');
  };

  const handleCreateCarrito = async (e) => {
      e.preventDefault();
      await createCarrito(newCarritoName, newCarritoOwner, newCarritoAddress);
      setNewCarritoName('');
      setNewCarritoOwner('');
      setNewCarritoAddress('');
      alert('Carrito creado');
  };

  const handleUpdateRestaurant = async (id) => {
      await updateRestaurant(id, { 
          name: editRestForm.name,
          owner_user_id: editRestForm.owner_user_id
      });
      setEditingRestId(null);
      alert('Restaurante actualizado');
  };

  const handleUpdateCarrito = async (id) => {
      await updateCarrito(id, { 
          name: editCarritoForm.name, 
          owner_user_id: editCarritoForm.owner_user_id,
          address: editCarritoForm.address
      });
      setEditingCarritoId(null);
      alert('Carrito actualizado');
  };

  const handleCreateCategory = async (e) => {
      e.preventDefault();
      try {
          await createCategory(newCatName);
          setNewCatName('');
          alert('Categoría creada');
      } catch (err) {
          alert('Error al crear categoría: ' + err.message);
      }
  };

  const handleDeleteCategory = async (id) => {
      if (!window.confirm('¿Eliminar esta categoría? Los productos asociados podrían quedar sin categoría.')) return;
      try {
          await deleteCategory(id);
      } catch (err) {
          alert('Error: ' + err.message);
      }
  };

  const getUserName = (id) => users.find(u => u.id === id)?.name || '...';

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 bg-white rounded-lg shadow-sm p-1">
         <button 
           className={`flex-1 px-6 py-3 font-bold rounded-md transition-colors ${activeTab === 'management' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
           onClick={() => setActiveTab('management')}
         >
           Inicio & Analítica
         </button>
         <button 
           className={`flex-1 px-6 py-3 font-bold rounded-md transition-colors ${activeTab === 'restaurants' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
           onClick={() => setActiveTab('restaurants')}
         >
           Restaurantes
         </button>
         <button 
           className={`flex-1 px-6 py-3 font-bold rounded-md transition-colors ${activeTab === 'carritos' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
           onClick={() => setActiveTab('carritos')}
         >
           Carritos
         </button>
         <button 
           className={`flex-1 px-6 py-3 font-bold rounded-md transition-colors ${activeTab === 'categories' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
           onClick={() => setActiveTab('categories')}
         >
           Categorías
         </button>
      </div>

      {activeTab === 'management' && (
      <div className="space-y-8 animate-fade-in">
        {/* Shortcuts */}
        <div className="grid gap-6 md:grid-cols-3">
            <div 
                onClick={() => setActiveTab('restaurants')}
                className="bg-white p-6 rounded-lg shadow flex items-center gap-4 cursor-pointer hover:border-purple-500 border border-transparent transition-all hover:shadow-md"
            >
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><MapPin /></div>
                <div>
                    <p className="text-gray-500">Restaurantes</p>
                    <p className="text-2xl font-bold">{restaurants.length}</p>
                </div>
            </div>
            <div 
                onClick={() => setActiveTab('carritos')}
                className="bg-white p-6 rounded-lg shadow flex items-center gap-4 cursor-pointer hover:border-blue-500 border border-transparent transition-all hover:shadow-md"
            >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><MapPin /></div>
                <div>
                    <p className="text-gray-500">Carritos</p>
                    <p className="text-2xl font-bold">{carritos.length}</p>
                </div>
            </div>
            <Link to="/admin/users" className="bg-white p-6 rounded-lg shadow flex items-center gap-4 cursor-pointer hover:border-green-500 border border-transparent transition-all hover:shadow-md">
                <div className="p-3 bg-green-100 text-green-600 rounded-full"><Users /></div>
                <div>
                    <p className="text-gray-500">Usuarios</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                </div>
            </Link>
        </div>

        {/* Analytics Section */}
        <div>
             <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                 <Activity className="text-orange-500"/> Resumen de Actividad
             </h2>
             
             {/* Filters */}
             <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 mb-6">
                 <div className="flex-1">
                     <label className="block text-sm font-bold text-gray-700 mb-1">Filtrar por Restaurante</label>
                     <select 
                         className="w-full border p-2 rounded"
                         value={analyticsFilterRest}
                         onChange={e => setAnalyticsFilterRest(e.target.value)}
                     >
                         <option value="all">Todos los Restaurantes</option>
                         {restaurants.map(r => (
                             <option key={r.id} value={r.id}>{r.name}</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex-1">
                     <label className="block text-sm font-bold text-gray-700 mb-1">Filtrar por Proveedor (Carrito)</label>
                     <select 
                         className="w-full border p-2 rounded"
                         value={analyticsFilterCarrito}
                         onChange={e => setAnalyticsFilterCarrito(e.target.value)}
                     >
                         <option value="all">Todos los Carritos</option>
                         {carritos.map(c => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                     </select>
                 </div>
             </div>

             {/* KPI Cards */}
             <div className="grid gap-6 md:grid-cols-4 mb-8">
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                     <div className="flex items-center gap-3 mb-2 text-green-600"><DollarSign /> <span className="font-bold">Ventas Totales</span></div>
                     <p className="text-3xl font-bold">${totalSales.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                     <div className="flex items-center gap-3 mb-2 text-blue-600"><ShoppingBag /> <span className="font-bold">Pedidos Cerrados</span></div>
                     <p className="text-3xl font-bold">{completedOrders.length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                     <div className="flex items-center gap-3 mb-2 text-orange-600"><Activity /> <span className="font-bold">Pedidos En Curso</span></div>
                     <p className="text-3xl font-bold">{activeOrders.length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                     <div className="flex items-center gap-3 mb-2 text-purple-600"><TrendingUp /> <span className="font-bold">Ticket Promedio</span></div>
                     <p className="text-3xl font-bold">${completedOrders.length ? Math.round(totalSales / completedOrders.length).toLocaleString() : 0}</p>
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
                 </div>

                 {/* Sales by Carrito Chart */}
                 <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="font-bold text-lg mb-6 text-gray-700">Ventas por Carrito (Proveedor)</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesByCarrito} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Bar dataKey="sales" fill="#82ca9d" name="Ventas ($)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
             </div>

             {/* Top Items Table */}
             <div className="bg-white p-6 rounded-lg shadow mt-8">
                 <h3 className="font-bold text-lg mb-4 text-gray-700">Productos Más Vendidos (Top 5)</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Producto</th>
                                <th className="p-4 text-right rounded-tr-lg">Cantidad Vendida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topItems.map((item, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4 text-right font-bold text-blue-600">{item.quantity}</td>
                                </tr>
                            ))}
                            {topItems.length === 0 && (
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

      {/* --- TAB: RESTAURANTS --- */}
      {activeTab === 'restaurants' && (
          <div className="space-y-8 animate-fade-in">
            {/* Create Restaurant */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-4">Crear Restaurante</h3>
                <form onSubmit={handleCreateRestaurant} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700">Nombre</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            value={newRestName} 
                            onChange={e => setNewRestName(e.target.value)}
                            placeholder="Ej: Pizzería Roma"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700">Dueño (Usuario)</label>
                        <select 
                            className="w-full border p-2 rounded"
                            value={newRestOwner}
                            onChange={e => setNewRestOwner(e.target.value)}
                            required
                        >
                            <option value="">Seleccionar Usuario...</option>
                            {restaurantUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                            ))}
                        </select>
                    </div>
                    <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Crear</button>
                </form>
            </div>

            {/* Restaurant List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="font-bold text-lg p-4 border-b bg-gray-50">Lista de Restaurantes</h3>
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-sm text-gray-500">
                        <tr>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Dueño</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {restaurants.map(r => (
                            <tr key={r.id}>
                                <td className="p-3 font-medium">
                                    {editingRestId === r.id ? (
                                        <input 
                                            className="border rounded px-2 py-1 w-full"
                                            value={editRestForm.name}
                                            onChange={e => setEditRestForm({...editRestForm, name: e.target.value})}
                                        />
                                    ) : r.name}
                                </td>
                                <td className="p-3 text-sm text-gray-600">
                                    {editingRestId === r.id ? (
                                        <select 
                                            className="border rounded px-2 py-1 w-full"
                                            value={editRestForm.owner_user_id}
                                            onChange={e => setEditRestForm({...editRestForm, owner_user_id: e.target.value})}
                                        >
                                            {restaurantUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    ) : getUserName(r.owner_user_id)}
                                </td>
                                <td className="p-3 text-right">
                                    {editingRestId === r.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleUpdateRestaurant(r.id)} className="text-green-600 font-bold text-xs">Guardar</button>
                                            <button onClick={() => setEditingRestId(null)} className="text-gray-500 text-xs">Cancelar</button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setEditingRestId(r.id);
                                                setEditRestForm({ name: r.name, owner_user_id: r.owner_user_id });
                                            }}
                                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold"
                                        >
                                            Editar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {restaurants.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-500">Sin registros</td></tr>}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {/* --- TAB: CARRITOS --- */}
      {activeTab === 'carritos' && (
          <div className="space-y-8 animate-fade-in">
            {/* Create Carrito */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-4">Crear Carrito</h3>
                <form onSubmit={handleCreateCarrito} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700">Nombre</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            value={newCarritoName} 
                            onChange={e => setNewCarritoName(e.target.value)}
                            placeholder="Ej: Tacos El Tío"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700">Dirección Base</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            value={newCarritoAddress} 
                            onChange={e => setNewCarritoAddress(e.target.value)}
                            placeholder="Ej: Esquina Norte"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700">Dueño (Usuario)</label>
                        <select 
                            className="w-full border p-2 rounded"
                            value={newCarritoOwner}
                            onChange={e => setNewCarritoOwner(e.target.value)}
                            required
                        >
                            <option value="">Seleccionar Usuario...</option>
                            {carritoUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                            ))}
                        </select>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Crear</button>
                </form>
            </div>

            {/* Carrito List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="font-bold text-lg p-4 border-b bg-gray-50">Lista de Carritos</h3>
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-sm text-gray-500">
                        <tr>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Dueño</th>
                            <th className="p-3">Dirección</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {carritos.map(c => (
                            <tr key={c.id}>
                                <td className="p-3 font-medium">
                                    {editingCarritoId === c.id ? (
                                        <input 
                                            className="border rounded px-2 py-1 w-full"
                                            value={editCarritoForm.name}
                                            onChange={e => setEditCarritoForm({...editCarritoForm, name: e.target.value})}
                                        />
                                    ) : c.name}
                                </td>
                                <td className="p-3 text-sm text-gray-600">
                                    {editingCarritoId === c.id ? (
                                        <select 
                                            className="border rounded px-2 py-1 w-full"
                                            value={editCarritoForm.owner_user_id}
                                            onChange={e => setEditCarritoForm({...editCarritoForm, owner_user_id: e.target.value})}
                                        >
                                            {carritoUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    ) : getUserName(c.owner_user_id)}
                                </td>
                                <td className="p-3 text-sm text-gray-500">
                                    {editingCarritoId === c.id ? (
                                        <input 
                                            className="border rounded px-2 py-1 w-full"
                                            value={editCarritoForm.address}
                                            onChange={e => setEditCarritoForm({...editCarritoForm, address: e.target.value})}
                                        />
                                    ) : c.address}
                                </td>
                                <td className="p-3 text-right">
                                    {editingCarritoId === c.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleUpdateCarrito(c.id)} className="text-green-600 font-bold text-xs">Guardar</button>
                                            <button onClick={() => setEditingCarritoId(null)} className="text-gray-500 text-xs">Cancelar</button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setEditingCarritoId(c.id);
                                                setEditCarritoForm({ name: c.name, owner_user_id: c.owner_user_id, address: c.address || '' });
                                            }}
                                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold"
                                        >
                                            Editar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {carritos.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">Sin registros</td></tr>}
                    </tbody>
                </table>
            </div>
          </div>
      )}


      {/* --- TAB: CATEGORIES --- */}
      {activeTab === 'categories' && (
          <div className="space-y-8 animate-fade-in">
            {/* Create Category */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-4">Crear Nueva Categoría</h3>
                <form onSubmit={handleCreateCategory} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-700">Nombre de Categoría</label>
                        <input 
                            className="w-full border p-2 rounded" 
                            value={newCatName} 
                            onChange={e => setNewCatName(e.target.value)}
                            placeholder="Ej: Postres"
                            required
                        />
                    </div>
                    <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold">Crear</button>
                </form>
            </div>

            {/* Category List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="font-bold text-lg p-4 border-b bg-gray-50">Lista de Categorías de Producto</h3>
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-sm text-gray-500">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Nombre</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {categories.map(c => (
                            <tr key={c.id}>
                                <td className="p-3 text-gray-500 text-sm">#{c.id}</td>
                                <td className="p-3 font-bold text-gray-800">{c.name}</td>
                                <td className="p-3 text-right">
                                    <button 
                                        onClick={() => handleDeleteCategory(c.id)}
                                        className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-500">No hay categorías definidas.</td></tr>}
                    </tbody>
                </table>
            </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;
