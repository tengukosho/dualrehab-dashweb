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
  FileText,
  Moon,
  Sun
} from 'lucide-react';
import { useDarkMode } from './DarkModeProvider';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const { isDark, setIsDark } = useDarkMode();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

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

  const adminMenuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/videos', icon: Video, label: 'Videos' },
    { path: '/categories', icon: Grid, label: 'Categories' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const expertMenuItems = [
    { path: '/videos', icon: Video, label: 'Videos' },
    { path: '/categories', icon: Grid, label: 'Categories' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
  ];

  const menuItems = currentUser?.role === 'admin' ? adminMenuItems : expertMenuItems;

  return (
    <div className={`w-64 border-r flex flex-col h-screen ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Logo */}
      <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h1 className="text-2xl font-bold text-blue-600">Rehab Admin</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                  ? isDark
                    ? 'bg-blue-900/50 text-blue-400 font-medium'
                    : 'bg-blue-50 text-blue-600 font-medium'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className={`border-t p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {currentUser && (
          <div className="mb-3">
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentUser.name}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentUser.email}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {currentUser.role}
            </p>
          </div>
        )}
        
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`flex items-center gap-3 w-full px-4 py-2 mb-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
