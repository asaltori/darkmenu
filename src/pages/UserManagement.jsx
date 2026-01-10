import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const UserManagement = () => {
  const { users, createUser, updateUser, deleteUser, restaurants } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const initialUserState = {
    username: '',
    password: '',
    name: '',
    role: 'waiter',
    restaurant_id: '' // For waiters
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setCurrentUser({ ...user });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setCurrentUser({ ...initialUserState });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const userToSave = { ...currentUser };
    if (userToSave.role !== 'waiter') userToSave.restaurant_id = null; // Clean up if role changed
    
    if (userToSave.id) {
      await updateUser(userToSave.id, userToSave);
    } else {
      await createUser(userToSave);
    }
    setIsEditing(false);
    setCurrentUser(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      await deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <button
          onClick={handleCreate}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
        >
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {currentUser.id ? 'Editar Usuario' : 'Crear Usuario'}
          </h3>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                type="text"
                value={currentUser.name}
                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Usuario (Login)</label>
              <input
                type="text"
                value={currentUser.username}
                onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="text"
                value={currentUser.password}
                onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol (Perfil)</label>
              <select
                value={currentUser.role}
                onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
              >
                <option value="admin">Administrador</option>
                <option value="restaurant">Restaurant (Dueño)</option>
                <option value="carrito">Carrito</option>
                <option value="waiter">Camarero</option>
              </select>
            </div>
            
            {currentUser.role === 'waiter' && (
                <div className="md:col-span-2 bg-yellow-50 p-3 rounded">
                    <label className="block text-sm font-medium text-gray-700">Asignar a Restaurante</label>
                    <select
                        value={currentUser.restaurant_id || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, restaurant_id: e.target.value })}
                        className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
                        required={currentUser.role === 'waiter'}
                    >
                        <option value="">Seleccionar Restaurante...</option>
                        {restaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={18} /> Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{user.name}</div>
                    {user.role === 'waiter' && user.restaurant_id && (
                        <div className="text-xs text-gray-500">
                            Rest: {restaurants.find(r => r.id === user.restaurant_id)?.name || 'N/A'}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'carrito' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
