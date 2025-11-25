import { useState, useEffect } from 'react';
import { 
  Users, Video, MessageSquare, TrendingUp, Calendar, UserCheck, 
  Activity, Clock, FolderOpen, BarChart3, PieChart, Download,
  FileText, Filter, ChevronDown, ChevronUp, Target, Award
} from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [videoStats, setVideoStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [activeUsers, setActiveUsers] = useState(null);
  const [hospitalStats, setHospitalStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7');
  const [expandedSection, setExpandedSection] = useState('overview');

  useEffect(() => {
    fetchAllStats();
  }, [timeFilter]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all statistics
      const [overview, videos, categories, userEngagement, active, hospitals] = await Promise.all([
        fetch('http://192.168.2.2:3000/api/stats/overview', { headers }).then(r => r.json()),
        fetch('http://192.168.2.2:3000/api/stats/videos', { headers }).then(r => r.json()),
        fetch('http://192.168.2.2:3000/api/stats/categories', { headers }).then(r => r.json()),
        fetch(`http://192.168.2.2:3000/api/stats/engagement?days=${timeFilter}`, { headers }).then(r => r.json()),
        fetch(`http://192.168.2.2:3000/api/stats/active-users?period=${timeFilter}`, { headers }).then(r => r.json()),
        fetch('http://192.168.2.2:3000/api/stats/hospitals', { headers }).then(r => r.json()).catch(() => ({ hospitals: [] }))
      ]);

      setStats(overview);
      setVideoStats(videos.topVideos || []);
      setCategoryStats(categories.categories || []);
      setEngagement(userEngagement.users || []);
      setActiveUsers(active);
      setHospitalStats(hospitals.hospitals || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Chart configurations
  const activeUsersChartData = {
    labels: activeUsers?.dailyActivity?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Active Users',
        data: activeUsers?.dailyActivity?.map(d => d.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
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

  const completionRateChartData = {
    labels: engagement.slice(0, 10).map(u => u.name),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: engagement.slice(0, 10).map(u => u.completionRate),
        backgroundColor: engagement.slice(0, 10).map(u => 
          u.completionRate >= 80 ? 'rgba(16, 185, 129, 0.8)' :
          u.completionRate >= 50 ? 'rgba(251, 191, 36, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
      }
    ]
  };

  const hospitalChartData = {
    labels: hospitalStats.map(h => h.hospital || 'Not specified'),
    datasets: [
      {
        data: hospitalStats.map(h => h.patientCount),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      }
    ]
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive rehabilitation platform insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Print Report"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.experts || 0} experts`}
          color="bg-blue-600"
        />
        <StatCard
          icon={Video}
          title="Total Videos"
          value={stats?.content?.videos || 0}
          subtitle={`${stats?.content?.categories || 0} categories`}
          color="bg-green-600"
        />
        <StatCard
          icon={Activity}
          title="Completion Rate"
          value={`${stats?.activity?.completionRate || 0}%`}
          subtitle={`${stats?.activity?.totalCompletions || 0} completions`}
          color="bg-purple-600"
        />
        <StatCard
          icon={UserCheck}
          title="Active Users"
          value={activeUsers?.activeUsers || 0}
          subtitle={`Last ${timeFilter} days`}
          color="bg-yellow-600"
        />
      </div>

      {/* Active Users Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">User Activity Trend</h2>
          <button
            onClick={() => exportToCSV(activeUsers?.dailyActivity || [], 'user_activity')}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Export
          </button>
        </div>
        <div className="h-64">
          <Line 
            data={activeUsersChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Category Performance</h2>
            <button
              onClick={() => exportToCSV(categoryStats, 'categories')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          <div className="h-64">
            <Bar 
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* User Completion Rates */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top User Completion Rates</h2>
            <button
              onClick={() => exportToCSV(engagement, 'engagement')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          <div className="h-64">
            <Bar 
              data={completionRateChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: { 
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Videos Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top Performing Videos</h2>
            <button
              onClick={() => exportToCSV(videoStats, 'videos')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {videoStats.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{video.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{video.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="font-semibold text-green-600">{video.completions}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{video.scheduled}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${video.scheduled > 0 ? (video.completions / video.scheduled * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {video.scheduled > 0 ? Math.round(video.completions / video.scheduled * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Engagement Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Patient Engagement Details</h2>
            <button
              onClick={() => exportToCSV(engagement, 'patient_engagement')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Export Full Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {engagement.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.totalScheduled}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.completed}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{user.completionRate}%</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            user.completionRate >= 80 ? 'bg-green-600' :
                            user.completionRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${user.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                      user.completionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.completionRate >= 80 ? 'Excellent' :
                       user.completionRate >= 50 ? 'Good' :
                       'Needs Support'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hospital Distribution (if available) */}
      {hospitalStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Hospital Distribution</h2>
            <button
              onClick={() => exportToCSV(hospitalStats, 'hospitals')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          <div className="h-64">
            <Doughnut 
              data={hospitalChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
