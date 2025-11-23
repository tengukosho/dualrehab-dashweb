import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Home, Video, Users, FolderOpen, MessageSquare, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Categories', href: '/categories', icon: FolderOpen },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b">
          <h1 className="text-xl font-bold text-primary-600">Rehab Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-3 flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
