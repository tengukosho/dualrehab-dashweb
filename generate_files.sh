#!/bin/bash

# Layout Component
cat > src/components/layout/Layout.jsx << 'EOF'
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
                className={\`flex items-center px-4 py-3 text-sm font-medium rounded-lg \${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }\`}
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
EOF

# Login Page
cat > src/pages/Login.jsx << 'EOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@rehab.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Rehab Admin</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-lg bg-white px-6 py-8 shadow">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
EOF

# Dashboard Page
cat > src/pages/Dashboard.jsx << 'EOF'
import { useQuery } from '@tanstack/react-query';
import { users, videos, messages, progress } from '../services/api';
import { Users, Video, MessageSquare, TrendingUp } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={\`rounded-full p-3 \${color}\`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: videosData } = useQuery({
    queryKey: ['videos'],
    queryFn: () => videos.getAll().then(res => res.data),
  });

  const { data: progressData } = useQuery({
    queryKey: ['stats'],
    queryFn: () => progress.getStats().then(res => res.data),
  });

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Videos"
          value={videosData?.pagination?.total || 0}
          icon={Video}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Users"
          value="--"
          icon={Users}
          color="bg-green-500"
        />
        <StatCard
          title="Messages"
          value="--"
          icon={MessageSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="Exercises Completed"
          value={progressData?.totalCompleted || 0}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Recent Activity</h2>
        <p className="text-gray-600">No recent activity</p>
      </div>
    </div>
  );
}
EOF

# Videos Page
cat > src/pages/Videos.jsx << 'EOF'
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videos, categories } from '../services/api';
import { Plus, Upload, Pencil, Trash2 } from 'lucide-react';

export default function Videos() {
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: () => videos.getAll().then(res => res.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.getAll().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => videos.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['videos']);
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Videos</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Upload Video
        </button>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difficulty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.videos?.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{video.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{video.category?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {video.difficultyLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(video.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
EOF

# Simple placeholder pages
cat > src/pages/Users.jsx << 'EOF'
export default function Users() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Users</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">User management coming soon...</p>
      </div>
    </div>
  );
}
EOF

cat > src/pages/Categories.jsx << 'EOF'
export default function Categories() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Categories</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">Category management coming soon...</p>
      </div>
    </div>
  );
}
EOF

cat > src/pages/Messages.jsx << 'EOF'
export default function Messages() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Messages</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">Message center coming soon...</p>
      </div>
    </div>
  );
}
EOF

echo "Files generated successfully!"
