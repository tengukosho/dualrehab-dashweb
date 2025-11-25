import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Home,
  Video,
  Users,
  Grid,
  MessageSquare,
  LogOut,
  BarChart3,
  FileText
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Redirect expert away from dashboard
  useEffect(() => {
    if (currentUser?.role === 'expert' && location.pathname === '/') {
      navigate('/videos');
    }
  }, [currentUser, location.pathname, navigate]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.2.2:3000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Admin gets full access including Dashboard, Analytics, and Reports
  const adminMenuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/videos', icon: Video, label: 'Videos' },
    { path: '/categories', icon: Grid, label: 'Categories' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  // Expert gets limited access (NO Dashboard, NO Analytics, NO Reports)
  const expertMenuItems = [
    { path: '/videos', icon: Video, label: 'Videos' },
    { path: '/categories', icon: Grid, label: 'Categories' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
  ];

  const menuItems = currentUser?.role === 'admin' ? adminMenuItems : expertMenuItems;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">Rehab Admin</h1>
        <p className="text-xs text-gray-500 mt-1">
          {currentUser?.role === 'admin' ? 'Administrator Portal' : 'Expert Portal'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        {currentUser && (
          <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {currentUser.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                currentUser.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentUser.role === 'admin' ? 'Administrator' : 'Expert'}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}