import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  X,
  Save,
  MessageSquare,
  Users as UsersIcon
} from 'lucide-react';
import { useDarkMode } from '../components/DarkModeProvider';
import { useI18n } from '../lib/i18n/I18nContext';

function StatCard({ title, value, subtitle, isDark }) {
  return (
    <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {subtitle && (
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function Users() {
  const { isDark } = useDarkMode();
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    hospital: '',
    assignedExpertId: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.2.2:3000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const allUsers = data.users || [];
      setUsers(allUsers);
      
      const expertsList = allUsers.filter(u => u.role === 'expert');
      setExperts(expertsList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      hospital: user.hospital || '',
      assignedExpertId: user.assignedExpertId || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://192.168.2.2:3000/api/admin/users/${selectedUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: editForm.name,
            phoneNumber: editForm.phoneNumber || null,
            hospital: editForm.hospital || null,
            assignedExpertId: editForm.assignedExpertId ? parseInt(editForm.assignedExpertId) : null
          })
        }
      );

      if (response.ok) {
        alert(t('users.updateSuccess'));
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`${t('users.updateFailed')}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(t('users.updateFailed'));
    }
  };

  const handleDelete = async (userId) => {
    if (currentUser?.role !== 'admin') {
      alert(t('users.onlyAdminDelete'));
      return;
    }

    if (!confirm(t('users.confirmDelete'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://192.168.2.2:3000/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert(t('users.deleteSuccess'));
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`${t('users.deleteFailed')}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t('users.deleteFailed'));
    }
  };

  const handleMessageUser = (user) => {
    navigate('/messages', { state: { selectedUser: user } });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'expert':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return t('users.admin');
      case 'expert': return t('users.expert');
      case 'patient': return t('users.patient');
      default: return role;
    }
  };

  const getExpertName = (expertId) => {
    if (!expertId) return t('users.noExpert');
    const expert = users.find(u => u.id === expertId);
    return expert ? expert.name : `Expert #${expertId}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const totalPatients = users.filter(u => u.role === 'patient').length;
  const totalExperts = users.filter(u => u.role === 'expert').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('users.title')}
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('users.manageTitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('users.totalUsers')}
          value={users.length}
          subtitle={`${t('users.all')} ${t('users.role')}`}
          isDark={isDark}
        />
        <StatCard
          title={t('users.patients')}
          value={totalPatients}
          isDark={isDark}
        />
        <StatCard
          title={t('users.experts')}
          value={totalExperts}
          isDark={isDark}
        />
        <StatCard
          title={t('users.admins')}
          value={totalAdmins}
          isDark={isDark}
        />
      </div>

      {/* Users Table */}
      <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('users.name')}
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('users.role')}
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('users.phone')}
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('users.hospital')}
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('users.assignedExpert')}
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('users.actions')}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {users.map((user) => (
                <tr key={user.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {user.phoneNumber && (
                        <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Phone className="w-4 h-4" />
                          <span className="text-xs">{user.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.hospital && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {user.hospital}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getExpertName(user.assignedExpertId)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleMessageUser(user)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title={t('users.sendMessage')}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title={t('users.editUser')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title={t('users.deleteUser')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('users.editUser')}</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('users.name')} *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('users.email')} ({t('common.view')})
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed text-sm ${
                    isDark ? 'bg-gray-900 border-gray-600 text-gray-500' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('users.phoneNumber')}
                </label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('users.hospital')}
                </label>
                <input
                  type="text"
                  value={editForm.hospital}
                  onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
                  placeholder={t('users.hospital')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                />
              </div>

              {selectedUser?.role === 'patient' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('users.assignedExpert')}
                  </label>
                  <select
                    value={editForm.assignedExpertId}
                    onChange={(e) => setEditForm({ ...editForm, assignedExpertId: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('users.noExpert')}</option>
                    {experts.map(expert => (
                      <option key={expert.id} value={expert.id}>
                        {expert.name} ({expert.email})
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {t('users.selectExpert')}
                  </p>
                </div>
              )}
            </div>

            <div className={`p-6 border-t flex items-center justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
