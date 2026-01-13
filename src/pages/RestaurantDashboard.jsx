import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { DollarSign, ChefHat, Activity, PlusCircle, Check, MapPin, QrCode, Trash2, Edit2, Save, X, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, TrendingUp, ShoppingBag, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RestaurantDashboard = () => {
  const { 
      carritoItems, restaurantMenu, getMyRestaurant, setRestaurantMenuItem, 
      orders, users, tables, createTable, updateTable, deleteTable, carritos, createUser 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'add' | 'tables' | 'staff' | 'analytics'
  const [priceInput, setPriceInput] = useState({});
  
  // Table Management State
  const [newTableNum, setNewTableNum] = useState('');
  const [editingTableId, setEditingTableId] = useState(null);
  const [editTableNum, setEditTableNum] = useState('');
  const [showQrTableId, setShowQrTableId] = useState(null);

  // Staff Management State
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterUser, setNewWaiterUser] = useState('');
  const [newWaiterPass, setNewWaiterPass] = useState('');

  const myRestaurant = getMyRestaurant();

  // Tag Definitions
  const availableTags = [
      { id: 'veggie', label: 'Vegetariano', icon: '🥗' },
      { id: 'vegan', label: 'Vegano', icon: '🌱' },
      { id: 'gluten_free', label: 'Sin Gluten', icon: '🌾' },
      { id: 'spicy', label: 'Picante', icon: '🌶️' },
      { id: 'sugar_free', label: 'Sin Azúcar', icon: '🍬' }
  ];

  if (!myRestaurant) {
      return <div className="p-10 text-center text-red-500">Error: No tienes un restaurante asignado. Contacta al administrador.</div>;
  }

  // --- Data Filtering ---
  const myMenuItems = restaurantMenu.filter(rm => rm.restaurantId === myRestaurant.id);
  const availableItems = carritoItems.filter(ci => 
      !myMenuItems.some(rm => rm.menuItemId === ci.id) && ci.active
  );
  const myOrders = orders.filter(o => o.restaurantId === myRestaurant.id);
  const myTables = tables.filter(t => t.restaurant_id === myRestaurant.id).sort((a, b) => a.position - b.position);
  const myWaiters = users.filter(u => u.role === 'waiter' && u.restaurant_id === myRestaurant.id);

  // --- ANALYTICS ---
  const completedOrders = myOrders.filter(o => ['pagado', 'entregado'].includes(o.status));
  const activeOrdersList = myOrders.filter(o => !['pagado', 'entregado', 'cancelado'].includes(o.status));
  
  const totalSales = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.sellingPrice * i.quantity), 0), 0);

  // Sales by Carrito
  const salesByCarrito = carritos.map(c => {
      let total = 0;
      completedOrders.forEach(o => {
          o.items.forEach(item => {
              if (item.carritoId === c.id) {
                  total += item.sellingPrice * item.quantity;
              }
          });
      });
      return { name: c.name, sales: total };
  }).filter(c => c.sales > 0).sort((a, b) => b.sales - a.sales);

  // Sales by Waiter
  const salesByWaiter = myWaiters.map(w => {
      const waiterOrders = completedOrders.filter(o => o.waiter_id === w.id);
      const total = waiterOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.sellingPrice * i.quantity), 0), 0);
      return { name: w.name, sales: total };
  }).sort((a, b) => b.sales - a.sales);

  // Top Items
  const itemSales = {};
  completedOrders.forEach(o => {
      o.items.forEach(item => {
          if (!itemSales[item.name]) itemSales[item.name] = 0;
          itemSales[item.name] += item.quantity;
      });
  });
  const topItems = Object.keys(itemSales)
      .map(name => ({ name, quantity: itemSales[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

  // --- Handlers ---
  const handleAddMenu = (itemId) => {
      const price = priceInput[itemId];
      if (!price) return alert('Ingresa un precio de venta');
      setRestaurantMenuItem(myRestaurant.id, itemId, Number(price), true);
      alert('Plato agregado al menú');
  };

  const handleUpdatePrice = (menuLinkId, itemId) => {
       const price = priceInput[itemId];
       if (!price) return;
       setRestaurantMenuItem(myRestaurant.id, itemId, Number(price), true);
       alert('Precio actualizado');
  };

  const handleCreateTable = async (e) => {
      e.preventDefault();
      if (!newTableNum.trim()) return;
      await createTable(myRestaurant.id, newTableNum);
      setNewTableNum('');
  };

  const handleUpdateTable = async (id) => {
      await updateTable(id, { table_number: editTableNum });
      setEditingTableId(null);
  };

  const handleDeleteTable = async (id) => {
      if (window.confirm('¿Eliminar esta mesa?')) {
          await deleteTable(id);
      }
  };

  const handleToggleTable = async (table) => {
      await updateTable(table.id, { active: !table.active });
  };

  const handleMoveTable = async (table, direction) => {
      const index = myTables.findIndex(t => t.id === table.id);
      if (index < 0) return;
      
      const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapWithIndex < 0 || swapWithIndex >= myTables.length) return;
      
      const swapTable = myTables[swapWithIndex];
      
      // Swap positions
      await updateTable(table.id, { position: swapTable.position });
      await updateTable(swapTable.id, { position: table.position });
  };

  const handleCreateWaiter = async (e) => {
      e.preventDefault();
      if (!newWaiterUser || !newWaiterPass || !newWaiterName) return alert('Completa todos los campos');
      
      await createUser({
          name: newWaiterName,
          username: newWaiterUser,
          password: newWaiterPass,
          role: 'waiter',
          restaurant_id: myRestaurant.id
      });
      
      setNewWaiterName('');
      setNewWaiterUser('');
      setNewWaiterPass('');
      alert('Camarero creado exitosamente');
  };

  const getOwnerName = (id) => users.find(u => u.id === id)?.name || '...';
  const getCarritoName = (id) => {
      const carrito = carritos.find(c => c.id === id);
      return carrito ? carrito.name : (users.find(u => u.id === id)?.name || '...'); // Fallback to owner name for legacy
  };
  const getTableNumber = (id) => tables.find(t => t.id === id)?.table_number || id;

  return (
    <div className="space-y-8 relative">
        {/* Global QR Modal */}
        {showQrTableId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative">
                    <button 
                        onClick={() => setShowQrTableId(null)} 
                        className="absolute top-4 right-4 text-gray-500 hover:text-black"
                    >
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-2xl font-bold mb-2">Mesa {getTableNumber(showQrTableId)}</h2>
                    <p className="text-gray-500 mb-6">{myRestaurant.name}</p>
                    
                    <div className="bg-white p-4 inline-block border-4 border-gray-100 rounded-lg mb-6">
                        <QRCodeSVG 
                            value={`${window.location.origin}/menu/${myRestaurant.id}/${showQrTableId}`}
                            size={250}
                            level="H"
                            includeMargin={true}
                        />
                    </div>
                    
                    <div className="grid gap-3">
                        <button 
                            onClick={() => window.print()} 
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <QrCode size={20} /> Imprimir QR
                        </button>
                        <button 
                            onClick={() => setShowQrTableId(null)} 
                            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{myRestaurant.name}</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Panel de Control</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b overflow-x-auto">
            <button 
                className={`pb-2 px-4 whitespace-nowrap ${activeTab === 'menu' ? 'border-b-2 border-orange-500 font-bold' : ''}`}
                onClick={() => setActiveTab('menu')}
            >
                Mi Carta
            </button>
            <button 
                className={`pb-2 px-4 whitespace-nowrap ${activeTab === 'add' ? 'border-b-2 border-orange-500 font-bold' : ''}`}
                onClick={() => setActiveTab('add')}
            >
                Agregar Platos (+{availableItems.length})
            </button>
            <button 
                className={`pb-2 px-4 whitespace-nowrap ${activeTab === 'tables' ? 'border-b-2 border-orange-500 font-bold' : ''}`}
                onClick={() => setActiveTab('tables')}
            >
                Gestionar Mesas ({myTables.length})
            </button>
            <button 
                className={`pb-2 px-4 whitespace-nowrap ${activeTab === 'staff' ? 'border-b-2 border-orange-500 font-bold' : ''}`}
                onClick={() => setActiveTab('staff')}
            >
                Personal ({myWaiters.length})
            </button>
            <button 
                className={`pb-2 px-4 whitespace-nowrap ${activeTab === 'analytics' ? 'border-b-2 border-orange-500 font-bold' : ''}`}
                onClick={() => setActiveTab('analytics')}
            >
                Analítica
            </button>
        </div>

        {/* --- TAB: MI CARTA --- */}
        {activeTab === 'menu' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4">Plato</th>
                            <th className="p-4">Proveedor</th>
                            <th className="p-4">Costo</th>
                            <th className="p-4">Venta</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myMenuItems.map(rm => {
                            const original = carritoItems.find(c => c.id === rm.menuItemId);
                            if (!original) return null;
                            return (
                                <tr key={rm.id} className="border-b">
                                    <td className="p-4 font-medium">{original.name}</td>
                                    <td className="p-4 text-sm text-gray-500">{getCarritoName(original.carritoId || original.ownerId)}</td>
                                    <td className="p-4 text-red-500">${original.costPrice}</td>
                                    <td className="p-4 text-green-600 font-bold">
                                        <input 
                                            className="w-20 border rounded px-2 py-1"
                                            placeholder={rm.sellingPrice}
                                            onChange={e => setPriceInput({...priceInput, [original.id]: e.target.value})}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${rm.active ? 'bg-green-100' : 'bg-red-100'}`}>
                                            {rm.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleUpdatePrice(rm.id, original.id)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Actualizar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {myMenuItems.length === 0 && <tr><td colSpan="6" className="p-4 text-center">Tu carta está vacía. Ve a "Agregar Platos".</td></tr>}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- TAB: AGREGAR PLATOS --- */}
        {activeTab === 'add' && (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {availableItems.map(item => (
                     <div key={item.id} className="bg-white p-4 rounded shadow border border-gray-200">
                         <h3 className="font-bold">{item.name}</h3>
                         <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                         
                         {/* Dietary Tags */}
                         {item.dietaryTags && item.dietaryTags.length > 0 && (
                             <div className="flex flex-wrap gap-1 mb-2">
                                 {item.dietaryTags.map(tagId => {
                                     const tag = availableTags.find(t => t.id === tagId);
                                     if (!tag) return null;
                                     return (
                                         <span key={tagId} title={tag.label} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                                             {tag.icon} {tag.label}
                                         </span>
                                     );
                                 })}
                             </div>
                         )}

                         <p className="text-xs text-gray-400 mb-2">Proveedor: {getCarritoName(item.carritoId || item.ownerId)}</p>
                         <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                             <span className="text-red-500 text-sm font-bold">Costo: ${item.costPrice}</span>
                             <div className="flex gap-2 items-center">
                                 <span className="text-sm font-bold text-green-700">Venta:</span>
                                 <input 
                                    className="w-20 border rounded px-1" 
                                    placeholder="$"
                                    onChange={e => setPriceInput({...priceInput, [item.id]: e.target.value})}
                                 />
                             </div>
                         </div>
                         <button 
                            onClick={() => handleAddMenu(item.id)}
                            className="w-full mt-3 bg-green-600 text-white py-1 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                         >
                             <PlusCircle size={16} /> Agregar a Carta
                         </button>
                     </div>
                 ))}
                 {availableItems.length === 0 && <p className="text-gray-500">No hay más platos disponibles de los carritos.</p>}
             </div>
        )}

        {/* --- TAB: GESTIONAR MESAS --- */}
        {activeTab === 'tables' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Agregar Mesa</h3>
                    <form onSubmit={handleCreateTable} className="flex gap-4">
                        <input 
                            className="flex-1 border p-2 rounded" 
                            value={newTableNum} 
                            onChange={e => setNewTableNum(e.target.value)}
                            placeholder="Nombre/Número de Mesa (Ej: Terraza 1)"
                            required
                        />
                        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold">
                            Agregar
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4 w-16">Orden</th>
                                <th className="p-4">Nombre de Mesa</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-center">QR</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTables.map((table, idx) => (
                                <tr key={table.id} className={`border-b ${!table.active ? 'bg-gray-50 opacity-60' : ''}`}>
                                    <td className="p-4 flex flex-col items-center gap-1">
                                        <button onClick={() => handleMoveTable(table, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-black disabled:opacity-30"><ArrowUp size={14}/></button>
                                        <button onClick={() => handleMoveTable(table, 'down')} disabled={idx === myTables.length - 1} className="text-gray-400 hover:text-black disabled:opacity-30"><ArrowDown size={14}/></button>
                                    </td>
                                    <td className="p-4 font-bold text-lg">
                                        {editingTableId === table.id ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    value={editTableNum} 
                                                    onChange={e => setEditTableNum(e.target.value)}
                                                    className="border rounded px-2 py-1 w-32"
                                                />
                                                <button onClick={() => handleUpdateTable(table.id)} className="text-green-600"><Save size={18}/></button>
                                                <button onClick={() => setEditingTableId(null)} className="text-gray-500"><X size={18}/></button>
                                            </div>
                                        ) : (
                                            <span>{table.table_number}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleToggleTable(table)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${table.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                        >
                                            {table.active ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center relative">
                                        <button 
                                            onClick={() => setShowQrTableId(showQrTableId === table.id ? null : table.id)}
                                            className="text-gray-600 hover:text-black"
                                        >
                                            <QrCode size={20} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-3">
                                        <button 
                                            onClick={() => { setEditingTableId(table.id); setEditTableNum(table.table_number); }}
                                            className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTable(table.id)}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {myTables.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No tienes mesas configuradas.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB: PERSONAL (CAMAREROS) --- */}
        {activeTab === 'staff' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ChefHat /> Registrar Nuevo Camarero</h3>
                    <form onSubmit={handleCreateWaiter} className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Nombre Completo</label>
                            <input 
                                className="w-full border p-2 rounded" 
                                value={newWaiterName} 
                                onChange={e => setNewWaiterName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Usuario (Login)</label>
                            <input 
                                className="w-full border p-2 rounded" 
                                value={newWaiterUser} 
                                onChange={e => setNewWaiterUser(e.target.value)}
                                placeholder="juan.perez"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Contraseña</label>
                            <input 
                                type="password"
                                className="w-full border p-2 rounded" 
                                value={newWaiterPass} 
                                onChange={e => setNewWaiterPass(e.target.value)}
                                placeholder="******"
                                required
                            />
                        </div>
                        <div className="md:col-span-3">
                            <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold w-full md:w-auto">
                                Crear Camarero
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h3 className="font-bold text-lg p-4 border-b bg-gray-50">Lista de Personal</h3>
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Fecha Ingreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myWaiters.map(waiter => (
                                <tr key={waiter.id} className="border-b">
                                    <td className="p-4 font-medium">{waiter.name}</td>
                                    <td className="p-4 text-gray-600">{waiter.username}</td>
                                    <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">Camarero</span></td>
                                    <td className="p-4 text-sm text-gray-500">{new Date(waiter.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {myWaiters.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No tienes camareros registrados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB: ANALYTICS --- */}
        {activeTab === 'analytics' && (
             <div className="space-y-8 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid gap-6 md:grid-cols-4">
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
                        <p className="text-3xl font-bold">{activeOrdersList.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <div className="flex items-center gap-3 mb-2 text-purple-600"><TrendingUp /> <span className="font-bold">Ticket Promedio</span></div>
                        <p className="text-3xl font-bold">${completedOrders.length ? Math.round(totalSales / completedOrders.length).toLocaleString() : 0}</p>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Sales by Carrito Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-6 text-gray-700">Ventas por Proveedor (Carrito)</h3>
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

                    {/* Sales by Waiter Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-6 text-gray-700">Rendimiento de Camareros</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={salesByWaiter}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip formatter={(value) => `$${value}`} />
                                   <Bar dataKey="sales" fill="#8884d8" name="Ventas ($)" radius={[4, 4, 0, 0]} />
                               </BarChart>
                           </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Items Table */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4 text-gray-700">Mis Platos Más Vendidos</h3>
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
        )}

        <div className="mt-8 border-t pt-8">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity /> Actividad Reciente</h2>
             <div className="bg-white p-4 rounded shadow">
                 {myOrders.length === 0 ? <p className="text-gray-500">Sin pedidos.</p> : (
                     <ul className="space-y-2">
                         {myOrders.slice(-5).map(o => (
                             <li key={o.id} className="border-b pb-2">
                                 <span className="font-bold">Mesa {getTableNumber(o.tableId)}</span>: {o.status} ({o.items.length} items)
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
