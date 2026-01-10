import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Users, FileText, Settings, Plus, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { restaurants, tables, users, createRestaurant, createTable } = useStore();
  
  // Create Restaurant State
  const [newRestName, setNewRestName] = useState('');
  const [newRestOwner, setNewRestOwner] = useState('');
  
  // Create Table State
  const [newTableRest, setNewTableRest] = useState('');
  const [newTableNum, setNewTableNum] = useState('');
  
  // QR Gen State
  const [selectedRestId, setSelectedRestId] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');

  // Filtered lists
  const restaurantUsers = users.filter(u => u.role === 'restaurant');
  const filteredTables = tables.filter(t => t.restaurant_id === Number(selectedRestId));

  const handleCreateRestaurant = async (e) => {
      e.preventDefault();
      await createRestaurant(newRestName, newRestOwner);
      setNewRestName('');
      setNewRestOwner('');
      alert('Restaurante creado');
  };

  const handleCreateTable = async (e) => {
      e.preventDefault();
      await createTable(newTableRest, newTableNum);
      setNewTableNum('');
      alert('Mesa creada');
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><MapPin /></div>
            <div>
                <p className="text-gray-500">Restaurantes</p>
                <p className="text-2xl font-bold">{restaurants.length}</p>
            </div>
        </div>
        <Link to="/admin/users" className="bg-white p-6 rounded-lg shadow flex items-center gap-4 cursor-pointer hover:border-green-500 border border-transparent">
            <div className="p-3 bg-green-100 text-green-600 rounded-full"><Users /></div>
            <div>
                <p className="text-gray-500">Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
            </div>
        </Link>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full"><QrCode /></div>
            <div>
                <p className="text-gray-500">Mesas Totales</p>
                <p className="text-2xl font-bold">{tables.length}</p>
            </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
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

          {/* Create Table */}
          <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-4">Agregar Mesa</h3>
              <form onSubmit={handleCreateTable} className="space-y-4">
                  <div>
                      <label className="block text-sm text-gray-700">Restaurante</label>
                      <select 
                        className="w-full border p-2 rounded"
                        value={newTableRest}
                        onChange={e => setNewTableRest(e.target.value)}
                        required
                      >
                          <option value="">Seleccionar...</option>
                          {restaurants.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm text-gray-700">Número/Nombre de Mesa</label>
                      <input 
                        className="w-full border p-2 rounded" 
                        value={newTableNum} 
                        onChange={e => setNewTableNum(e.target.value)}
                        placeholder="Ej: 5, Terraza-1, VIP"
                        required
                      />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Agregar Mesa</button>
              </form>
          </div>
      </div>

      {/* QR Generator */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <QrCode /> Generador de QR
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">1. Selecciona Restaurante</label>
                    <select 
                        className="w-full border p-2 rounded"
                        value={selectedRestId}
                        onChange={e => { setSelectedRestId(e.target.value); setSelectedTableId(''); }}
                    >
                        <option value="">Seleccionar...</option>
                        {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                
                {selectedRestId && (
                    <div>
                        <label className="block text-sm font-medium mb-1">2. Selecciona Mesa</label>
                        <div className="grid grid-cols-4 gap-2">
                            {filteredTables.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTableId(t.id)}
                                    className={`p-2 border rounded text-center ${selectedTableId === t.id ? 'bg-orange-600 text-white' : 'hover:bg-gray-50'}`}
                                >
                                    {t.table_number}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed">
                {selectedTableId ? (
                    <>
                         <div className="bg-white p-4 rounded shadow-sm mb-4">
                            <QRCodeSVG 
                                value={`${window.location.origin}/menu/${selectedRestId}/${selectedTableId}`}
                                size={200}
                                level="H"
                            />
                        </div>
                        <p className="font-bold">Mesa {filteredTables.find(t => t.id === selectedTableId)?.table_number}</p>
                        <p className="text-sm text-gray-500">{restaurants.find(r => r.id === Number(selectedRestId))?.name}</p>
                    </>
                ) : (
                    <p className="text-gray-400">Selecciona mesa para ver QR</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
