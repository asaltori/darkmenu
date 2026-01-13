import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Plus, Minus, X, Trash2, Check } from 'lucide-react';

const ClientMenu = () => {
  const { restaurantId, tableId } = useParams();
  const { carritoItems, restaurantMenu, placeOrder, restaurants, tables, orders, categories, ingredients, menuItemIngredients } = useStore();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'status'
  
  // Item Customization State
  const [customizingItem, setCustomizingItem] = useState(null); // The item currently being customized before adding
  const [selectedIngredients, setSelectedIngredients] = useState([]); // Array of ingredient IDs checked by user for the customizingItem

  // Animation States
  const [animatingCart, setAnimatingCart] = useState(false);
  const [addedItemId, setAddedItemId] = useState(null);

  // Identify Restaurant and Table
  const restaurant = restaurants.find(r => r.id === Number(restaurantId));
  const table = tables.find(t => t.id === Number(tableId));

  // Get My Orders
  const myOrders = orders.filter(o => 
      Number(o.restaurantId) === Number(restaurantId) && 
      Number(o.tableId) === Number(tableId) &&
      o.status !== 'pagado'
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Auto-switch to status tab if there are active orders and cart is empty on load
  React.useEffect(() => {
      if (myOrders.length > 0 && cart.length === 0 && activeTab === 'menu') {
          setActiveTab('status'); 
      }
  }, [myOrders.length]);

  // Build the Menu:
  // 1. Get all items that THIS restaurant has added to their menu (restaurant_menu_items)
  // 2. Join with the original carrito item details (name, description)
  // 3. Use the restaurant's selling_price
  // 4. Filter only active ones
  
  const menuList = restaurantMenu
    .filter(rm => rm.restaurantId === Number(restaurantId) && rm.active && rm.sellingPrice > 0)
    .map(rm => {
        const originalItem = carritoItems.find(ci => ci.id === rm.menuItemId);
        if (!originalItem) return null;
        return {
            ...originalItem, // name, description, ownerId
            id: rm.menuItemId, // Keep original ID for reference or use rm.id? Use original ID for grouping orders by owner
            sellingPrice: rm.sellingPrice,
            menuLinkId: rm.id
        };
    })
    .filter(Boolean);


  const addToCart = (item, customIngredients = null) => {
    // If item has ingredients and we haven't customized it yet, open customization modal
    if (!customIngredients) {
        const itemIngs = menuItemIngredients.filter(link => link.menuItemId === item.id);
        if (itemIngs.length > 0) {
            setCustomizingItem(item);
            // Default selected ingredients are those marked is_default
            setSelectedIngredients(itemIngs.filter(l => l.isDefault).map(l => l.ingredientId));
            return;
        }
    }

    // Generate a unique key for cart items based on ID + ingredients to allow same item with different mods
    const finalIngredients = customIngredients || [];
    const cartItemId = `${item.id}-${finalIngredients.sort().join(',')}`;

    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
          ...item, 
          cartItemId, 
          quantity: 1,
          selectedIngredients: finalIngredients 
      }];
    });
    
    // Trigger Animations
    setAnimatingCart(true);
    setAddedItemId(item.id);
    setTimeout(() => setAnimatingCart(false), 300); // Short bounce
    setTimeout(() => setAddedItemId(null), 1000);   // Show "Added" for 1s
    
    // Close modal if open
    setCustomizingItem(null);
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartItemId === cartItemId) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    await placeOrder(Number(restaurantId), Number(tableId), cart);
    alert('¡Solicitud enviada! Un camarero confirmará tu orden en breve.');
    setCart([]);
    setIsCartOpen(false);
    setActiveTab('status'); // Switch to status tab
  };
  
  const getStatusColor = (status) => {
      switch(status) {
          case 'pendiente_confirmacion': return 'bg-yellow-100 text-yellow-800';
          case 'confirmado': return 'bg-gray-100 text-gray-800'; // Waiter accepted, in queue
          case 'en_preparacion': return 'bg-yellow-100 text-yellow-800';
          case 'listo': return 'bg-blue-100 text-blue-800';
          case 'en_camino': return 'bg-orange-100 text-orange-800';
          case 'entregado': return 'bg-purple-100 text-purple-800'; // At restaurant
          case 'entregado_cliente': return 'bg-green-100 text-green-800'; // Final
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  const getStatusText = (status) => {
      switch(status) {
          case 'pendiente_confirmacion': return 'Esperando Confirmación';
          case 'confirmado': return 'En Cola de Cocina';
          case 'en_preparacion': return 'Cocinando...';
          case 'listo': return 'Listo en Cocina';
          case 'en_camino': return 'En Camino a Mesa';
          case 'entregado': return 'En Restaurante';
          case 'entregado_cliente': return '¡Entregado!';
          default: return status;
      }
  };

  // Tag Definitions
  const availableTags = [
      { id: 'veggie', label: 'Vegetariano', icon: '🥗' },
      { id: 'vegan', label: 'Vegano', icon: '🌱' },
      { id: 'gluten_free', label: 'Sin Gluten', icon: '🌾' },
      { id: 'spicy', label: 'Picante', icon: '🌶️' },
      { id: 'sugar_free', label: 'Sin Azúcar', icon: '🍬' }
  ];

  if (!restaurant) return <div className="p-10 text-center">Cargando menú... (o restaurante no encontrado)</div>;

  return (
    <div className="pb-20">
      <header className="bg-orange-600 text-white sticky top-0 z-10 shadow-md">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div>
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              <p className="text-xs opacity-90">Mesa {table ? table.table_number : tableId}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={`relative p-2 transition-transform ${animatingCart ? 'scale-125 text-yellow-200' : ''}`}
          >
            <ShoppingCart />
            {cart.length > 0 && (
              <span className={`absolute -top-1 -right-1 bg-white text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-transform ${animatingCart ? 'scale-150' : ''}`}>
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-orange-700">
            <button 
                onClick={() => setActiveTab('menu')}
                className={`flex-1 py-2 text-sm font-bold ${activeTab === 'menu' ? 'bg-orange-800 text-white' : 'text-orange-200'}`}
            >
                Menú
            </button>
            <button 
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'status' ? 'bg-orange-800 text-white' : 'text-orange-200'}`}
            >
                Mis Pedidos
                {myOrders.length > 0 && <span className="bg-white text-orange-800 text-xs rounded-full px-1.5">{myOrders.length}</span>}
            </button>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {activeTab === 'menu' ? (
            menuList.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
                <p className="text-xl">Este restaurante aún no ha configurado su menú.</p>
            </div>
            ) : (
            <div className="space-y-8">
                {/* Group by Category */}
                {[...categories, { id: null, name: 'Otros' }].map(category => {
                    const categoryItems = menuList.filter(item => {
                        if (category.id === null) return !item.categoryId;
                        return item.categoryId === category.id;
                    });

                    if (categoryItems.length === 0) return null;

                    return (
                        <div key={category.id || 'uncategorized'}>
                            <h3 className="text-xl font-bold mb-4 text-orange-800 border-b-2 border-orange-200 pb-1 inline-block">
                                {category.name}
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {categoryItems.map(item => (
                                <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                                    <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400 relative">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl">🍽️</span>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg leading-tight">
                                            {item.name}
                                            {/* Show Tags in Title */}
                                            {item.dietaryTags && item.dietaryTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
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
                                        </h3>
                                        <span className="font-bold text-orange-600 text-lg whitespace-nowrap ml-2">${item.sellingPrice}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 flex-1">{item.description}</p>
                                    <button 
                                        onClick={() => addToCart(item)}
                                        className={`w-full py-2 rounded font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                                            addedItemId === item.id 
                                            ? 'bg-green-500 text-white scale-105 shadow-lg' 
                                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        }`}
                                    >
                                        {addedItemId === item.id ? (
                                            <>
                                                <Check size={18} className="animate-bounce" /> ¡Agregado!
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} /> Agregar
                                            </>
                                        )}
                                    </button>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            )
        ) : (
            // --- STATUS TAB ---
            <div className="space-y-4">
                <h2 className="font-bold text-lg mb-4">Estado de mis Pedidos</h2>
                {myOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                        No has realizado pedidos en esta mesa aún.
                    </div>
                ) : (
                    myOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-orange-500">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <span className="text-sm text-gray-500">#{order.id ? String(order.id).slice(0, 8) : '...'}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                            </div>
                            <div className="p-4">
                                <ul className="space-y-3 mb-4">
                                    {order.items.map((item, idx) => {
                                        // Individual item status handling
                                        const itemStatus = item.status || 'pendiente';
                                        
                                        return (
                                        <li key={idx} className="flex justify-between items-center text-sm border-b border-dashed pb-2 last:border-0">
                                            <div>
                                                <span className="font-bold">{item.name}</span> <span className="text-gray-500">x{item.quantity}</span>
                                                {/* Show selected ingredients */}
                                                {item.selectedIngredients && item.selectedIngredients.length > 0 && (
                                                    <div className="text-xs text-gray-500 italic">
                                                        + {item.selectedIngredients.map(ingId => ingredients.find(i => i.id === ingId)?.name).filter(Boolean).join(', ')}
                                                    </div>
                                                )}
                                                <div className="mt-1">
                                                    {/* Show Item Status Badge */}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        itemStatus === 'listo' ? 'bg-blue-100 text-blue-800' :
                                                        itemStatus === 'en_preparacion' ? 'bg-yellow-100 text-yellow-800' :
                                                        itemStatus === 'pendiente' ? 'bg-gray-100 text-gray-500' :
                                                        itemStatus === 'en_camino' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {itemStatus === 'pendiente' ? 'En espera' : itemStatus.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-bold">${item.sellingPrice * item.quantity}</span>
                                        </li>
                                        );
                                    })}
                                </ul>
                                <div className="border-t pt-2 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Total</span>
                                    <span className="font-bold text-lg text-orange-600">
                                        ${order.items.reduce((s, i) => s + (i.sellingPrice * i.quantity), 0)}
                                    </span>
                                </div>
                                {order.status === 'pendiente_confirmacion' && (
                                    <p className="text-xs text-center text-gray-400 mt-2 bg-yellow-50 p-1 rounded">
                                        Esperando que un camarero tome tu orden...
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Ingredient Customization Modal */}
      {customizingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                  <div className="p-4 border-b bg-orange-50">
                      <h3 className="font-bold text-lg text-orange-900">Personalizar {customizingItem.name}</h3>
                      <p className="text-xs text-orange-700">Elige tus ingredientes</p>
                  </div>
                  <div className="p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-3">
                          {menuItemIngredients
                              .filter(link => link.menuItemId === customizingItem.id)
                              .map(link => {
                                  const ing = ingredients.find(i => i.id === link.ingredientId);
                                  if (!ing) return null;
                                  return (
                                      <label key={link.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                          <div className="flex items-center gap-3">
                                              <input 
                                                  type="checkbox"
                                                  checked={selectedIngredients.includes(ing.id)}
                                                  onChange={(e) => {
                                                      if (e.target.checked) {
                                                          setSelectedIngredients([...selectedIngredients, ing.id]);
                                                      } else {
                                                          setSelectedIngredients(selectedIngredients.filter(id => id !== ing.id));
                                                      }
                                                  }}
                                                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                              />
                                              <span className="font-medium">{ing.name}</span>
                                          </div>
                                          {/* Price adjustment support prepared but not used yet */}
                                      </label>
                                  );
                              })
                          }
                      </div>
                  </div>
                  <div className="p-4 border-t bg-gray-50 flex gap-3">
                      <button 
                          onClick={() => setCustomizingItem(null)}
                          className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={() => addToCart(customizingItem, selectedIngredients)}
                          className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col animate-slide-in">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">Tu carrito está vacío</div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId || item.id} className="flex justify-between items-center border-b pb-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.selectedIngredients && item.selectedIngredients.length > 0 && (
                          <div className="text-xs text-gray-500 italic mt-1">
                              Con: {item.selectedIngredients.map(ingId => ingredients.find(i => i.id === ingId)?.name).filter(Boolean).join(', ')}
                          </div>
                      )}
                      <p className="text-gray-500 text-sm">${item.sellingPrice} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 rounded bg-gray-100">
                        <Minus size={16} />
                      </button>
                      <span className="w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 rounded bg-gray-100">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="ml-2 text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total</span>
                <span>${total}</span>
              </div>
              <button 
                onClick={handleOrder}
                disabled={cart.length === 0}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
              >
                Solicitar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientMenu;
