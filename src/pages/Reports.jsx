import { useState, useEffect } from 'react';
import { Download, Check, AlertCircle, Printer } from 'lucide-react';
import { useDarkMode } from '../components/DarkModeProvider';
import { useI18n } from '../lib/i18n/I18nContext';

export default function Reports() {
  const { isDark } = useDarkMode();
  const { t, language } = useI18n();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientProgress, setPatientProgress] = useState(null);
  const [patientSchedules, setPatientSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.2.2:3000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPatients(data.filter(u => u.role === 'patient'));
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchPatientData = async (patientId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [progressRes, schedulesRes] = await Promise.all([
        fetch(`http://192.168.2.2:3000/api/admin/user/${patientId}/progress`, { headers }),
        fetch(`http://192.168.2.2:3000/api/admin/user/${patientId}/schedules`, { headers })
      ]);

      if (!progressRes.ok || !schedulesRes.ok) {
        throw new Error('Failed to fetch patient data');
      }

      const progress = await progressRes.json();
      const schedules = await schedulesRes.json();

      setPatientProgress(progress);
      setPatientSchedules(schedules);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setPatientProgress({ progress: [] });
      setPatientSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchPatientData(patient.id);
  };

  const generateReport = () => {
    if (!selectedPatient || !patientProgress) return;
    
    setGenerating(true);
    
    const reportContent = createReportContent();
    const html = generateHTMLReport(reportContent);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patient_report_${selectedPatient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    setTimeout(() => setGenerating(false), 1000);
  };

  const printReport = () => {
    if (!selectedPatient || !patientProgress) return;
    
    const reportContent = createReportContent();
    const html = generateHTMLReport(reportContent);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const createReportContent = () => {
    const patient = selectedPatient;
    const progress = patientProgress?.progress || [];
    const schedules = patientSchedules || [];
    
    const totalExercises = progress.length;
    const uniqueVideos = [...new Set(progress.map(p => p.videoId))].length;
    const avgRating = progress.filter(p => p.rating).length > 0
      ? (progress.filter(p => p.rating).reduce((sum, p) => sum + p.rating, 0) / progress.filter(p => p.rating).length).toFixed(1)
      : 0;
    
    const completedSchedules = schedules.filter(s => s.completed).length;
    const totalSchedules = schedules.length;
    const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules * 100).toFixed(1) : 0;
    
    const progressByCategory = {};
    progress.forEach(p => {
      const category = p.video?.category?.name || 'Uncategorized';
      if (!progressByCategory[category]) {
        progressByCategory[category] = 0;
      }
      progressByCategory[category]++;
    });
    
    return {
      patient,
      statistics: {
        totalExercises,
        uniqueVideos,
        averageRating: avgRating,
        completedSchedules,
        totalSchedules,
        completionRate
      },
      progressByCategory,
      recentProgress: progress.slice(0, 10),
      upcomingSchedules: schedules.filter(s => !s.completed && new Date(s.scheduledDate) >= new Date()).slice(0, 5)
    };
  };

  const generateHTMLReport = (content) => {
    const { patient, statistics, progressByCategory, recentProgress, upcomingSchedules } = content;
    const isVietnamese = language === 'vi';
    
    const translations = {
      title: isVietnamese ? 'Báo cáo Bệnh nhân' : 'Patient Report',
      generatedOn: isVietnamese ? 'Tạo vào' : 'Generated on',
      at: isVietnamese ? 'lúc' : 'at',
      basicInfo: isVietnamese ? 'Thông tin cơ bản' : 'Basic Info',
      name: isVietnamese ? 'Họ tên' : 'Name',
      email: isVietnamese ? 'Email' : 'Email',
      hospital: isVietnamese ? 'Bệnh viện' : 'Hospital',
      totalExercises: isVietnamese ? 'Tổng bài tập' : 'Total Exercises',
      completionRate: isVietnamese ? 'Tỷ lệ hoàn thành' : 'Completion Rate',
      avgRating: isVietnamese ? 'Đánh giá TB' : 'Average Rating',
      progressByCategory: isVietnamese ? 'Tiến độ theo danh mục' : 'Progress by Category',
      exercisesCompleted: isVietnamese ? 'bài tập đã hoàn thành' : 'exercises completed',
      recentProgress: isVietnamese ? 'Tiến độ gần đây' : 'Recent Progress',
      date: isVietnamese ? 'Ngày' : 'Date',
      exercise: isVietnamese ? 'Bài tập' : 'Exercise',
      category: isVietnamese ? 'Danh mục' : 'Category',
      rating: isVietnamese ? 'Đánh giá' : 'Rating',
      upcomingSchedules: isVietnamese ? 'Lịch sắp tới' : 'Upcoming Schedules',
      status: isVietnamese ? 'Trạng thái' : 'Status',
      completed: isVietnamese ? 'Đã hoàn thành' : 'Completed',
      pending: isVietnamese ? 'Đang chờ' : 'Pending',
      noData: isVietnamese ? 'Không có dữ liệu' : 'No Data'
    };
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${translations.title} - ${patient.name}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #1e293b; margin: 0; font-size: 28px; }
    .subtitle { color: #64748b; margin-top: 5px; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; }
    td { color: #64748b; }
    .category-item { display: flex; justify-content: space-between; padding: 10px; background: #f8fafc; margin-bottom: 8px; border-radius: 4px; }
    @media print { body { background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${translations.title}</h1>
      <p class="subtitle">${translations.generatedOn} ${new Date().toLocaleDateString()} ${translations.at} ${new Date().toLocaleTimeString()}</p>
    </div>

    <div class="section">
      <h2 class="section-title">${translations.basicInfo}</h2>
      <p><strong>${translations.name}:</strong> ${patient.name}</p>
      <p><strong>${translations.email}:</strong> ${patient.email}</p>
      <p><strong>${translations.hospital}:</strong> ${patient.hospital || 'N/A'}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${statistics.totalExercises}</div>
        <div class="stat-label">${translations.totalExercises}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.completionRate}%</div>
        <div class="stat-label">${translations.completionRate}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.averageRating}/5</div>
        <div class="stat-label">${translations.avgRating}</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">${translations.progressByCategory}</h2>
      ${Object.keys(progressByCategory).length > 0 ? Object.entries(progressByCategory).map(([cat, count]) => `
        <div class="category-item">
          <span>${cat}</span>
          <span><strong>${count}</strong> ${translations.exercisesCompleted}</span>
        </div>
      `).join('') : `<p>${translations.noData}</p>`}
    </div>

    <div class="section">
      <h2 class="section-title">${translations.recentProgress}</h2>
      ${recentProgress.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>${translations.date}</th>
              <th>${translations.exercise}</th>
              <th>${translations.category}</th>
              <th>${translations.rating}</th>
            </tr>
          </thead>
          <tbody>
            ${recentProgress.map(p => `
              <tr>
                <td>${new Date(p.completionDate).toLocaleDateString()}</td>
                <td>${p.video?.title || 'Unknown'}</td>
                <td>${p.video?.category?.name || 'Uncategorized'}</td>
                <td>${p.rating ? `${p.rating}/5` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<p>${translations.noData}</p>`}
    </div>

    <div class="section">
      <h2 class="section-title">${translations.upcomingSchedules}</h2>
      ${upcomingSchedules.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>${translations.date}</th>
              <th>${translations.exercise}</th>
              <th>${translations.status}</th>
            </tr>
          </thead>
          <tbody>
            ${upcomingSchedules.map(s => `
              <tr>
                <td>${new Date(s.scheduledDate).toLocaleDateString()}</td>
                <td>${s.video?.title || 'Unknown'}</td>
                <td>${s.completed ? translations.completed : translations.pending}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<p>${translations.noData}</p>`}
    </div>
  </div>
</body>
</html>`;
  };

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('reports.title')}
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('reports.selectPatient')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Patient List */}
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('users.patients')}
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {patients.length === 0 ? (
              <p className={`text-center py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('reports.noPatients')}
              </p>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPatient?.id === patient.id
                      ? isDark
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-blue-600 bg-blue-50'
                      : isDark
                        ? 'border-gray-700 hover:bg-gray-700'
                        : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {patient.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {patient.email}
                      </p>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('reports.generateReport')}
          </h2>
          {selectedPatient ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <p className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                  {t('reports.selectedPatient')}
                </p>
                <p className={`text-lg font-semibold ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                  {selectedPatient.name}
                </p>
                <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  {selectedPatient.email}
                </p>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('reports.loadingData')}
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={generateReport}
                    disabled={!patientProgress || generating}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('reports.generating')}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t('reports.downloadReport')}
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={printReport}
                    disabled={!patientProgress}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    {t('reports.printReport')}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('reports.pleaseSelect')}
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {selectedPatient && patientProgress && !loading && (
          <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('reports.summary')}
            </h2>
            <div className="space-y-3">
              <StatBox 
                label={t('reports.totalExercises')}
                value={patientProgress?.progress?.length || 0} 
                isDark={isDark} 
              />
              <StatBox 
                label={t('reports.scheduledSessions')}
                value={patientSchedules.length} 
                isDark={isDark} 
              />
              <StatBox 
                label={t('analytics.completed')}
                value={patientSchedules.filter(s => s.completed).length} 
                isDark={isDark} 
              />
              <StatBox 
                label={t('analytics.completionRate')}
                value={`${patientSchedules.length > 0 ? Math.round((patientSchedules.filter(s => s.completed).length / patientSchedules.length) * 100) : 0}%`} 
                isDark={isDark} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Patient Data Preview */}
      {selectedPatient && patientProgress && !loading && (
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('reports.recentProgress')}
          </h2>
          
          {patientProgress?.progress?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('time.date')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('reports.exercise')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('videos.category')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('reports.rating')}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {patientProgress?.progress?.slice(0, 10).map((progress) => (
                    <tr key={progress.id}>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(progress.completionDate).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {progress.video?.title || 'Unknown'}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {progress.video?.category?.name || 'Uncategorized'}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {progress.rating ? `${progress.rating}/5` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('reports.noProgressData')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, isDark }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
