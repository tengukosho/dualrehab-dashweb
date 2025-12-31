import { useQuery } from '@tanstack/react-query';
import { videos, categories, admin } from '../services/api';
import { Users, Video, MessageSquare, TrendingUp, Calendar, UserCheck, Activity, Clock, FolderOpen } from 'lucide-react';
import { useDarkMode } from '../components/DarkModeProvider';
import { useI18n } from '../lib/i18n/I18nContext';

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
  const { t } = useI18n();

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
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.title')}</h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.systemOverview')} • {t('users.all')}</p>
      </div>
      
      {/* Main Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.totalVideos')}
          value={totalVideos}
          icon={Video}
          color="bg-blue-500"
          subtitle={t('dashboard.exerciseLibrary')}
          isDark={isDark}
        />
        <StatCard
          title={t('dashboard.totalPatients')}
          value={totalUsers}
          icon={Users}
          color="bg-green-500"
          subtitle={`${totalExperts} ${t('dashboard.experts')}`}
          isDark={isDark}
        />
        <StatCard
          title={t('dashboard.totalCompletions')}
          value={totalCompletions}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle={t('dashboard.allTime')}
          isDark={isDark}
        />
        <StatCard
          title={t('dashboard.activeSchedules')}
          value={upcomingSchedules}
          icon={Calendar}
          color="bg-orange-500"
          subtitle={`${completedSchedules} ${t('analytics.completed')}`}
          isDark={isDark}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('dashboard.last7Days')}
          value={completionsLast7Days}
          icon={Activity}
          color="bg-indigo-500"
          subtitle={t('dashboard.exercisesCompleted')}
          isDark={isDark}
        />
        <StatCard
          title={t('dashboard.last30Days')}
          value={completionsLast30Days}
          icon={Clock}
          color="bg-pink-500"
          subtitle={t('dashboard.monthlyActivity')}
          isDark={isDark}
        />
        <StatCard
          title={t('dashboard.categories')}
          value={totalCategories}
          icon={FolderOpen}
          color="bg-teal-500"
          subtitle={t('dashboard.videoCategories')}
          isDark={isDark}
        />
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Health */}
        <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.platformHealth')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.videoLibrary')}</span>
              <span className="text-sm font-semibold text-green-600">
                {totalVideos > 0 ? `${totalVideos} ${t('videos.videos')}` : t('dashboard.empty')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.activePatients')}</span>
              <span className="text-sm font-semibold text-blue-600">
                {totalUsers} {totalUsers === 1 ? t('users.patient') : t('dashboard.patients')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.avgVideoDuration')}</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {avgDuration > 0 ? `${avgDuration} ${t('videos.minutes')}` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.engagementRate')}</span>
              <span className="text-sm font-semibold text-purple-600">
                {completionsLast7Days > 0 ? t('users.active') : t('dashboard.low')}
              </span>
            </div>
          </div>
        </div>

        {/* Video Distribution by Category */}
        <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.videoDistribution')}</h2>
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
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('dashboard.noCategoriesYet')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - System Wide */}
      <div className={`mt-8 rounded-lg p-6 shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.systemActivity')}</h2>
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {totalCompletions > 0 ? (
            <div className="space-y-2">
              <p>✓ <span className="font-semibold">{totalCompletions}</span> {t('dashboard.totalExercisesCompleted')}</p>
              <p>✓ <span className="font-semibold">{completionsLast7Days}</span> {t('dashboard.completionsLast7Days')}</p>
              <p>✓ <span className="font-semibold">{completionsLast30Days}</span> {t('dashboard.completionsLast30Days')}</p>
              <p>✓ <span className="font-semibold">{upcomingSchedules}</span> {t('dashboard.upcomingSchedules')}</p>
              <p>✓ <span className="font-semibold">{totalUsers}</span> {t('dashboard.registeredPatients')}</p>
              {completionsLast7Days > 20 && (
                <p className="mt-3 font-semibold text-green-600">
                  🎉 {t('dashboard.highEngagement')}
                </p>
              )}
            </div>
          ) : (
            <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>{t('dashboard.noActivityYet')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
