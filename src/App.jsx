import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/AuthContext';
import { DarkModeProvider } from './components/DarkModeProvider';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DarkModeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route - Login */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes with layout */}
              <Route
                path="/*"
                element={
                  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                      <Routes>
                        {/* Dashboard - ADMIN ONLY */}
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />

                        {/* Videos - All authenticated users */}
                        <Route
                          path="/videos"
                          element={
                            <ProtectedRoute>
                              <Videos />
                            </ProtectedRoute>
                          }
                        />

                        {/* Categories - All authenticated users */}
                        <Route
                          path="/categories"
                          element={
                            <ProtectedRoute>
                              <Categories />
                            </ProtectedRoute>
                          }
                        />

                        {/* Users - All authenticated users */}
                        <Route
                          path="/users"
                          element={
                            <ProtectedRoute>
                              <Users />
                            </ProtectedRoute>
                          }
                        />

                        {/* Messages - All authenticated users */}
                        <Route
                          path="/messages"
                          element={
                            <ProtectedRoute>
                              <Messages />
                            </ProtectedRoute>
                          }
                        />

                        {/* Analytics - ADMIN ONLY */}
                        <Route
                          path="/analytics"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <Analytics />
                            </ProtectedRoute>
                          }
                        />

                        {/* Reports - ADMIN ONLY */}
                        <Route
                          path="/reports"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <Reports />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </DarkModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
