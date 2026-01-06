import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LogOut, User } from 'lucide-react';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-orange-600">RestoPlatform</Link>
          
          {currentUser && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-gray-600">
                <User size={18} />
                {currentUser.name} ({currentUser.role})
              </span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 hover:text-red-700"
              >
                <LogOut size={18} />
                Salir
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
