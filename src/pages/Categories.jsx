import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Video, X } from 'lucide-react';
import api from '../services/api';
import { useDarkMode } from '../components/DarkModeProvider';
import { useI18n } from '../lib/i18n/I18nContext';

function StatCard({ title, value, icon: Icon, color, isDark }) {
  return (
    <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const { isDark } = useDarkMode();
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        alert(t('categories.updateSuccess'));
      } else {
        await api.post('/categories', formData);
        alert(t('categories.addSuccess'));
      }
      
      await loadCategories();
      closeModal();
    } catch (error) {
      alert(editingCategory ? t('categories.updateFailed') : t('categories.addFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('categories.confirmDelete'))) return;
    
    try {
      await api.delete(`/categories/${id}`);
      alert(t('categories.deleteSuccess'));
      await loadCategories();
    } catch (error) {
      alert(t('categories.deleteFailed'));
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        order: category.order
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        order: categories.length
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', order: 0 });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalVideos = categories.reduce((sum, cat) => sum + (cat._count?.videos || 0), 0);
  const avgVideos = categories.length > 0 ? Math.round(totalVideos / categories.length) : 0;

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('categories.title')}
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('categories.manageTitle')}
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            {t('categories.addCategory')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('dashboard.totalCategories')}
          value={categories.length}
          icon={FolderOpen}
          color="bg-blue-500"
          isDark={isDark}
        />
        <StatCard
          title={t('dashboard.totalVideos')}
          value={totalVideos}
          icon={Video}
          color="bg-green-500"
          isDark={isDark}
        />
        <StatCard
          title={t('categories.avgVideos')}
          value={avgVideos}
          icon={FolderOpen}
          color="bg-purple-500"
          isDark={isDark}
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className={`rounded-lg shadow hover:shadow-lg transition-shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                  </div>
                  {category.description && (
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {category.description}
                    </p>
                  )}
                  <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span>{category._count?.videos || 0} {t('categories.videos')}</span>
                    </div>
                    <div>
                      {t('categories.order')}: {category.order}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`flex gap-2 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => openModal(category)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Edit2 className="h-4 w-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className={`col-span-full text-center py-12 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <FolderOpen className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('categories.noCategories')}
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('dashboard.noCategoriesYet')}
            </p>
            <button
              onClick={() => openModal()}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {t('categories.addCategory')}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingCategory ? t('categories.editCategory') : t('categories.addCategory')}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('categories.categoryName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                  placeholder={t('categories.categoryName')}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('categories.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                  placeholder={t('categories.description')}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('categories.order')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                    isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  {editingCategory ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
