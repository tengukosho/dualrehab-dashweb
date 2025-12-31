import { useState, useEffect } from 'react';
import { Video, Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';
import api from '../services/api';
import { useDarkMode } from '../components/DarkModeProvider';
import { useI18n } from '../lib/i18n/I18nContext';

function StatCard({ title, value, color, isDark }) {
  return (
    <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`mt-2 text-3xl font-bold ${color || (isDark ? 'text-white' : 'text-gray-900')}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function Videos() {
  const { isDark } = useDarkMode();
  const { t } = useI18n();
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVideos();
    loadCategories();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/videos');
      setVideos(response.data.videos || response.data);
    } catch (error) {
      console.error('Failed to load videos:', error);
      alert(t('videos.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('videos.confirmDelete'))) return;
    
    try {
      await api.delete(`/videos/${id}`);
      await loadVideos();
      alert(t('videos.deleteSuccess'));
    } catch (error) {
      alert(t('videos.deleteFailed'));
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setShowEditModal(true);
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      const formData = new FormData(e.target);
      const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        categoryId: parseInt(formData.get('categoryId')),
        duration: parseInt(formData.get('duration')),
        difficultyLevel: formData.get('difficultyLevel'),
        instructions: formData.get('instructions')
      };

      await api.put(`/videos/${editingVideo.id}`, data);
      await loadVideos();
      setShowEditModal(false);
      setEditingVideo(null);
      alert(t('videos.updateSuccess'));
    } catch (error) {
      alert(t('videos.updateFailed'));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    const formData = new FormData(e.target);
    
    try {
      await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadVideos();
      setShowUploadModal(false);
      alert(t('videos.addSuccess'));
      e.target.reset();
    } catch (error) {
      alert(t('videos.addFailed'));
    } finally {
      setUploading(false);
    }
  };

  const filteredAndSortedVideos = videos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (video.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || video.categoryId === parseInt(categoryFilter);
      const matchesDifficulty = difficultyFilter === 'all' || video.difficultyLevel === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.uploadDate) - new Date(a.uploadDate);
        case 'oldest':
          return new Date(a.uploadDate) - new Date(b.uploadDate);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (level) => {
    switch(level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level) => {
    switch(level) {
      case 'beginner': return t('videos.beginner');
      case 'intermediate': return t('videos.intermediate');
      case 'advanced': return t('videos.advanced');
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('videos.title')}
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('videos.manageTitle')}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            {t('videos.uploadVideo')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.totalVideos')}
          value={videos.length}
          isDark={isDark}
        />
        <StatCard
          title={t('videos.beginner')}
          value={videos.filter(v => v.difficultyLevel === 'beginner').length}
          color="text-green-600"
          isDark={isDark}
        />
        <StatCard
          title={t('videos.intermediate')}
          value={videos.filter(v => v.difficultyLevel === 'intermediate').length}
          color="text-yellow-600"
          isDark={isDark}
        />
        <StatCard
          title={t('videos.advanced')}
          value={videos.filter(v => v.difficultyLevel === 'advanced').length}
          color="text-red-600"
          isDark={isDark}
        />
      </div>

      {/* Filters */}
      <div className={`mb-6 rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={t('videos.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm ${
                isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
              }`}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-4 py-2 border rounded-lg text-sm ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
            }`}
          >
            <option value="all">{t('videos.allCategories')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className={`px-4 py-2 border rounded-lg text-sm ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
            }`}
          >
            <option value="all">{t('videos.allDifficulties')}</option>
            <option value="beginner">{t('videos.beginner')}</option>
            <option value="intermediate">{t('videos.intermediate')}</option>
            <option value="advanced">{t('videos.advanced')}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 border rounded-lg text-sm ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
            }`}
          >
            <option value="newest">{t('videos.newestFirst')}</option>
            <option value="oldest">{t('videos.oldestFirst')}</option>
            <option value="title">{t('videos.titleAZ')}</option>
          </select>
        </div>
      </div>

      {/* Videos Table */}
      <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {filteredAndSortedVideos.length === 0 ? (
          <div className="text-center py-12">
            <Video className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('videos.noVideos')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('videos.videoTitle')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('videos.category')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('videos.difficulty')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('videos.duration')}
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('users.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredAndSortedVideos.map((video) => (
                  <tr key={video.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {video.title}
                        </p>
                        {video.description && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                            {video.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getCategoryName(video.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficultyLevel)}`}>
                        {getDifficultyLabel(video.difficultyLevel)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatDuration(video.duration)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(video)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title={t('videos.editVideo')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title={t('videos.deleteVideo')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('videos.uploadVideo')}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.videoFile')} *
                </label>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  required
                  disabled={uploading}
                  className={`w-full text-sm ${
                    isDark ? 'text-gray-300 file:bg-gray-700 file:text-white' : 'file:bg-gray-50'
                  } file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium hover:file:bg-gray-600`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.videoTitle')} *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  disabled={uploading}
                  className={`w-full px-4 py-2 border rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.description')}
                </label>
                <textarea
                  name="description"
                  rows={3}
                  disabled={uploading}
                  className={`w-full px-4 py-2 border rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('videos.category')} *
                  </label>
                  <select
                    name="categoryId"
                    required
                    disabled={uploading}
                    className={`w-full px-4 py-2 border rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('videos.selectCategory')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('videos.difficulty')} *
                  </label>
                  <select
                    name="difficultyLevel"
                    required
                    disabled={uploading}
                    className={`w-full px-4 py-2 border rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    <option value="beginner">{t('videos.beginner')}</option>
                    <option value="intermediate">{t('videos.intermediate')}</option>
                    <option value="advanced">{t('videos.advanced')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.duration')} (seconds) *
                </label>
                <input
                  type="number"
                  name="duration"
                  required
                  min="1"
                  disabled={uploading}
                  placeholder="300"
                  className={`w-full px-4 py-2 border rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                    isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {t('videos.uploadVideo')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('videos.editVideo')}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVideo(null);
                }}
                className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateVideo} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.videoTitle')} *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingVideo.title}
                  className={`w-full px-4 py-2 border rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.description')}
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingVideo.description || ''}
                  className={`w-full px-4 py-2 border rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('videos.category')} *
                  </label>
                  <select
                    name="categoryId"
                    required
                    defaultValue={editingVideo.categoryId}
                    className={`w-full px-4 py-2 border rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('videos.difficulty')} *
                  </label>
                  <select
                    name="difficultyLevel"
                    required
                    defaultValue={editingVideo.difficultyLevel}
                    className={`w-full px-4 py-2 border rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    <option value="beginner">{t('videos.beginner')}</option>
                    <option value="intermediate">{t('videos.intermediate')}</option>
                    <option value="advanced">{t('videos.advanced')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('videos.duration')} (seconds) *
                </label>
                <input
                  type="number"
                  name="duration"
                  required
                  min="1"
                  defaultValue={editingVideo.duration}
                  className={`w-full px-4 py-2 border rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVideo(null);
                  }}
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
                  {t('common.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
