import { useState, useEffect } from 'react';
import { 
  Users, Video, Activity, UserCheck, Download
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useDarkMode } from '../components/DarkModeProvider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const { isDark } = useDarkMode();
  const [stats, setStats] = useState(null);
  const [videoStats, setVideoStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [activeUsers, setActiveUsers] = useState(null);
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
        fetch(`${baseURL}/stats/overview`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/stats/videos`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/stats/categories`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/stats/engagement?days=${timeFilter}`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/stats/active-users?period=${timeFilter}`, { headers }).then(r => r.json())
      ]);

      setStats(overview);
      setVideoStats(videos.topVideos || []);
      setCategoryStats(categories.categories || []);
      setEngagement(engagementData.users || []);
      setActiveUsers(activeData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid: { color: isDark ? '#374151' : '#e5e7eb' }
      },
      y: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid: { color: isDark ? '#374151' : '#e5e7eb' },
        beginAtZero: true
      }
    }
  };

  const activeUsersChartData = {
    labels: activeUsers?.dailyActivity?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Active Users',
      data: activeUsers?.dailyActivity?.map(d => d.count) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3
    }]
  };

  const categoryChartData = {
    labels: categoryStats.map(c => c.name),
    datasets: [
      {
        label: 'Videos',
        data: categoryStats.map(c => c.videoCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Completions',
        data: categoryStats.map(c => c.totalCompletions),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      }
    ]
  };

  const engagementChartData = {
    labels: engagement.slice(0, 10).map(u => u.name),
    datasets: [{
      label: 'Completion Rate (%)',
      data: engagement.slice(0, 10).map(u => u.completionRate),
      backgroundColor: engagement.slice(0, 10).map(u => 
        u.completionRate >= 80 ? 'rgba(16, 185, 129, 0.8)' :
        u.completionRate >= 50 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      ),
    }]
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Analytics Dashboard
              </h1>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Comprehensive platform statistics and insights
              </p>
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Patients"
            value={stats?.users?.total || 0}
            subtitle={`${stats?.users?.experts || 0} experts`}
            color="bg-blue-600"
            isDark={isDark}
          />
          <StatCard
            icon={Video}
            title="Total Videos"
            value={stats?.content?.videos || 0}
            subtitle={`${stats?.content?.categories || 0} categories`}
            color="bg-green-600"
            isDark={isDark}
          />
          <StatCard
            icon={Activity}
            title="Completion Rate"
            value={`${stats?.activity?.completionRate || 0}%`}
            subtitle={`${stats?.activity?.completedSchedules || 0} completed`}
            color="bg-purple-600"
            isDark={isDark}
          />
          <StatCard
            icon={UserCheck}
            title="Active Users"
            value={activeUsers?.activeUsers || 0}
            subtitle={`Last ${timeFilter} days`}
            color="bg-yellow-600"
            isDark={isDark}
          />
        </div>

        {/* User Activity Chart */}
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              User Activity Trend
            </h2>
          </div>
          <div className="h-64">
            <Line data={activeUsersChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category & Engagement Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Category Performance
              </h2>
              <button
                onClick={() => exportToCSV(categoryStats, 'categories')}
                className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Export
              </button>
            </div>
            <div className="h-64">
              <Bar data={categoryChartData} options={chartOptions} />
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Top Completion Rates
              </h2>
              <button
                onClick={() => exportToCSV(engagement, 'engagement')}
                className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Export
              </button>
            </div>
            <div className="h-64">
              <Bar 
                data={engagementChartData} 
                options={{
                  ...chartOptions,
                  indexAxis: 'y',
                  scales: {
                    ...chartOptions.scales,
                    x: { 
                      ...chartOptions.scales.x,
                      max: 100
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Top Videos Table */}
        <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Top Videos
              </h2>
              <button
                onClick={() => exportToCSV(videoStats, 'top_videos')}
                className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Video
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Category
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Completions
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Scheduled
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {videoStats.map((video) => (
                  <tr key={video.id}>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {video.title}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {video.category}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {video.completions}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {video.scheduled}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, color, isDark }) {
  return (
    <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
