import { useState, useEffect } from 'react';
import { Users, Video, Activity, Download, TrendingUp } from 'lucide-react';
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

export default function Analytics() {
  const { isDark } = useDarkMode();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [videoStats, setVideoStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7');

  useEffect(() => {
    fetchAllStats();
  }, [timeFilter]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const baseURL = 'http://192.168.2.2:3000/api';

      const [overview, videos, categories, engagementData, activeData] = await Promise.all([
        fetch(`${baseURL}/stats/overview`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${baseURL}/stats/videos`, { headers }).then(r => r.json()).catch(() => ({ topVideos: [] })),
        fetch(`${baseURL}/stats/categories`, { headers }).then(r => r.json()).catch(() => ({ categories: [] })),
        fetch(`${baseURL}/stats/engagement?days=${timeFilter}`, { headers }).then(r => r.json()).catch(() => ({ users: [] })),
        fetch(`${baseURL}/stats/active-users?period=${timeFilter}`, { headers }).then(r => r.json()).catch(() => null)
      ]);

      setStats(overview);
      setVideoStats(videos.topVideos || []);
      setCategoryStats(categories.categories || []);
      setEngagement(engagementData.users || []);
      setActiveUsersData(activeData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert(t('common.noData'));
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPatients = stats?.users?.total || 0;
  const totalVideos = stats?.content?.videos || 0;
  const completionRate = stats?.activity?.completionRate || 0;
  const activeUsers = activeUsersData?.activeUsers || 0;

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('analytics.title')}
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('analytics.subtitle')}
            </p>
          </div>
          <button
            onClick={() => exportToCSV(engagement, 'analytics')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            {t('analytics.export')}
          </button>
        </div>
      </div>

      {/* Time Filter */}
      <div className={`mb-6 rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
          }`}
        >
          <option value="7">{t('analytics.last7Days')}</option>
          <option value="30">{t('dashboard.last30Days')}</option>
          <option value="90">{t('reports.last90days')}</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('analytics.totalPatients')}
          value={totalPatients}
          icon={Users}
          color="bg-blue-500"
          isDark={isDark}
        />
        <StatCard
          title={t('analytics.totalVideos')}
          value={totalVideos}
          icon={Video}
          color="bg-green-500"
          isDark={isDark}
        />
        <StatCard
          title={t('analytics.completionRate')}
          value={`${completionRate}%`}
          icon={Activity}
          color="bg-purple-500"
          isDark={isDark}
        />
        <StatCard
          title={t('analytics.activeUsers')}
          value={activeUsers}
          icon={TrendingUp}
          color="bg-orange-500"
          isDark={isDark}
        />
      </div>

      {/* Category Performance */}
      <div className={`mb-8 rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('analytics.categoryPerformance')}
        </h2>
        <div className="space-y-4">
          {categoryStats.length === 0 ? (
            <p className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('common.noData')}
            </p>
          ) : (
            categoryStats.map((category, index) => {
              const maxCompletions = Math.max(...categoryStats.map(c => c.totalCompletions), 1);
              const percentage = (category.totalCompletions / maxCompletions) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {category.totalCompletions} {t('analytics.completions')}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Videos */}
      <div className={`mb-8 rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('analytics.topCompletionRates')}
        </h2>
        <div className="space-y-3">
          {videoStats.length === 0 ? (
            <p className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('common.noData')}
            </p>
          ) : (
            videoStats.map((video, index) => (
              <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                      <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {video.title}
                      </h3>
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {video.category} • {video.completions} {t('analytics.completions')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Engagement */}
      {engagement.length > 0 && (
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.userActivityTrend')}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('users.name')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('reports.totalExercises')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('analytics.completed')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('analytics.completionRate')}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {engagement.slice(0, 10).map((user, index) => (
                  <tr key={index}>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.totalProgress}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.completed}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-green-600"
                            style={{ width: `${user.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs w-12 text-right">{user.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
