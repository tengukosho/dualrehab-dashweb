import { useQuery } from '@tanstack/react-query';
import { videos, categories, admin } from '../services/api';
import { Users, Video, MessageSquare, TrendingUp, Calendar, UserCheck, Activity, Clock, FolderOpen } from 'lucide-react';
import { useDarkMode } from '../components/DarkModeProvider';

function StatCard({ title, value, icon: Icon, color, subtitle, isDark }) {
  return (
    <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && (
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
          )}
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isDark } = useDarkMode();

  // Get global stats from admin endpoint
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => admin.getStats().then(res => res.data).catch(() => null),
  });

  const { data: videosData } = useQuery({
    queryKey: ['videos'],
    queryFn: () => videos.getAll().then(res => res.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.getAll().then(res => res.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => admin.getUsers().then(res => res.data).catch(() => []),
  });

  const { data: allProgress } = useQuery({
    queryKey: ['all-progress'],
    queryFn: () => admin.getAllProgress().then(res => res.data).catch(() => ({ progress: [] })),
  });

  const { data: allSchedules } = useQuery({
    queryKey: ['all-schedules'],
    queryFn: () => admin.getAllSchedules().then(res => res.data).catch(() => []),
  });

  // Calculate stats from all users
  const totalVideos = videosData?.pagination?.total || videosData?.videos?.length || 0;
  const totalCategories = categoriesData?.length || 0;
  const totalUsers = usersData?.filter(u => u.role === 'patient').length || 0;
  const totalExperts = usersData?.filter(u => u.role === 'expert').length || 0;
  
  // Global progress stats (all users combined)
  const totalCompletions = adminStats?.totalCompletions || allProgress?.progress?.length || 0;
  const completionsLast7Days = adminStats?.completedLast7Days || 0;
  const completionsLast30Days = adminStats?.completedLast30Days || 0;
  
  // Schedule stats (all users)
  const upcomingSchedules = allSchedules?.filter(s => !s.completed).length || 0;
  const completedSchedules = allSchedules?.filter(s => s.completed).length || 0;
  
  // Engagement metrics
  const avgCompletionRate = totalVideos > 0 ? Math.round((totalCompletions / (totalVideos * Math.max(totalUsers, 1))) * 100) : 0;
  const avgDuration = videosData?.videos?.length > 0
    ? Math.round(videosData.videos.reduce((acc, v) => acc + v.duration, 0) / videosData.videos.length / 60)
    : 0;

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>System-wide overview • All users</p>
      </div>
      
      {/* Main Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Videos"
          value={totalVideos}
          icon={Video}
          color="bg-blue-500"
          subtitle="Exercise library"
          isDark={isDark}
        />
        <StatCard
          title="Total Patients"
          value={totalUsers}
          icon={Users}
          color="bg-green-500"
          subtitle={`${totalExperts} experts`}
          isDark={isDark}
        />
        <StatCard
          title="Total Completions"
          value={totalCompletions}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle="All time (all users)"
          isDark={isDark}
        />
        <StatCard
          title="Active Schedules"
          value={upcomingSchedules}
          icon={Calendar}
          color="bg-orange-500"
          subtitle={`${completedSchedules} completed`}
          isDark={isDark}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Last 7 Days"
          value={completionsLast7Days}
          icon={Activity}
          color="bg-indigo-500"
          subtitle="Exercises completed"
          isDark={isDark}
        />
        <StatCard
          title="Last 30 Days"
          value={completionsLast30Days}
          icon={Clock}
          color="bg-pink-500"
          subtitle="Monthly activity"
          isDark={isDark}
        />
        <StatCard
          title="Categories"
          value={totalCategories}
          icon={FolderOpen}
          color="bg-teal-500"
          subtitle="Video categories"
          isDark={isDark}
        />
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Health */}
        <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Video Library</span>
              <span className="text-sm font-semibold text-green-600">
                {totalVideos > 0 ? `${totalVideos} videos` : 'Empty'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Patients</span>
              <span className="text-sm font-semibold text-blue-600">
                {totalUsers} {totalUsers === 1 ? 'patient' : 'patients'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average Video Duration</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {avgDuration > 0 ? `${avgDuration} min` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Engagement Rate</span>
              <span className="text-sm font-semibold text-purple-600">
                {completionsLast7Days > 0 ? 'Active' : 'Low'}
              </span>
            </div>
          </div>
        </div>

        {/* Video Distribution by Category */}
        <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Video Distribution</h2>
          <div className="space-y-3">
            {categoriesData?.slice(0, 5).map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{category.name}</span>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-32 overflow-hidden rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${totalVideos > 0 ? Math.min((category._count?.videos || 0) / totalVideos * 100, 100) : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {category._count?.videos || 0}
                  </span>
                </div>
              </div>
            ))}
            {(!categoriesData || categoriesData.length === 0) && (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No categories yet. Create some to organize videos.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - System Wide */}
      <div className={`mt-8 rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>System Activity</h2>
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {totalCompletions > 0 ? (
            <div className="space-y-2">
              <p>✓ <span className="font-semibold">{totalCompletions}</span> total exercises completed by all patients</p>
              <p>✓ <span className="font-semibold">{completionsLast7Days}</span> completions in the last 7 days</p>
              <p>✓ <span className="font-semibold">{completionsLast30Days}</span> completions in the last 30 days</p>
              <p>✓ <span className="font-semibold">{upcomingSchedules}</span> upcoming scheduled exercises across all patients</p>
              <p>✓ <span className="font-semibold">{totalUsers}</span> registered patients using the platform</p>
              {completionsLast7Days > 20 && (
                <p className="mt-3 font-semibold text-green-600">
                  🎉 High engagement! Platform is actively being used.
                </p>
              )}
            </div>
          ) : (
            <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>No activity yet. Patients will appear here once they start using the platform.</p>
          )}
        </div>
      </div>
    </div>
  );
}
