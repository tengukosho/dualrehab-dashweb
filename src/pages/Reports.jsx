import { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, User, Activity, 
  Target, TrendingUp, Award, Clock, Filter,
  Printer, Mail, Check, X, AlertCircle
} from 'lucide-react';

export default function Reports() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientProgress, setPatientProgress] = useState(null);
  const [patientSchedules, setPatientSchedules] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('comprehensive');
  const [includeCharts, setIncludeCharts] = useState(true);

  useEffect(() => {
    fetchPatients();
    setDefaultDateRange();
  }, []);

  const setDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

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

      // Fetch patient's progress and schedules
      const [progressRes, schedulesRes] = await Promise.all([
        fetch(`http://192.168.2.2:3000/api/admin/user/${patientId}/progress`, { headers }),
        fetch(`http://192.168.2.2:3000/api/admin/user/${patientId}/schedules`, { headers })
      ]);

      const progress = await progressRes.json();
      const schedules = await schedulesRes.json();

      setPatientProgress(progress);
      setPatientSchedules(schedules);
    } catch (error) {
      console.error('Error fetching patient data:', error);
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
    
    // Create report content
    const reportContent = createReportContent();
    
    // Create and download HTML report
    const html = generateHTMLReport(reportContent);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patient_report_${selectedPatient.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    setTimeout(() => {
      setGenerating(false);
    }, 1000);
  };

  const createReportContent = () => {
    const patient = selectedPatient;
    const progress = patientProgress?.progress || [];
    const schedules = patientSchedules || [];
    
    // Calculate statistics
    const totalExercises = progress.length;
    const uniqueVideos = [...new Set(progress.map(p => p.videoId))].length;
    const averageRating = progress.filter(p => p.rating).reduce((sum, p) => sum + p.rating, 0) / 
                          progress.filter(p => p.rating).length || 0;
    
    const completedSchedules = schedules.filter(s => s.completed).length;
    const totalSchedules = schedules.length;
    const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules * 100).toFixed(1) : 0;
    
    // Group progress by date
    const progressByDate = {};
    progress.forEach(p => {
      const date = new Date(p.completionDate).toLocaleDateString();
      if (!progressByDate[date]) {
        progressByDate[date] = [];
      }
      progressByDate[date].push(p);
    });
    
    // Group by category
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
        averageRating: averageRating.toFixed(1),
        completedSchedules,
        totalSchedules,
        completionRate
      },
      progressByDate,
      progressByCategory,
      recentProgress: progress.slice(0, 10),
      upcomingSchedules: schedules.filter(s => !s.completed && new Date(s.scheduledDate) >= new Date()).slice(0, 5)
    };
  };

  const generateHTMLReport = (content) => {
    const { patient, statistics, progressByDate, progressByCategory, recentProgress, upcomingSchedules } = content;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Progress Report - ${patient.name}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e293b;
      margin: 0;
      font-size: 28px;
    }
    .subtitle {
      color: #64748b;
      margin-top: 5px;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 15px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #f8fafc;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
    }
    .progress-bar {
      background: #e2e8f0;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      background: #10b981;
      height: 100%;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success {
      background: #dcfce7;
      color: #166534;
    }
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rehabilitation Progress Report</h1>
      <div class="subtitle">
        Generated on ${new Date().toLocaleDateString()} | 
        Period: ${dateRange.start} to ${dateRange.end}
      </div>
    </div>
    
    <div class="section">
      <h2 style="color: #1e293b;">Patient Information</h2>
      <table>
        <tr>
          <td><strong>Name:</strong></td>
          <td>${patient.name}</td>
          <td><strong>Email:</strong></td>
          <td>${patient.email}</td>
        </tr>
        <tr>
          <td><strong>Hospital:</strong></td>
          <td>${patient.hospital || 'Not specified'}</td>
          <td><strong>Phone:</strong></td>
          <td>${patient.phoneNumber || 'Not specified'}</td>
        </tr>
      </table>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${statistics.totalExercises}</div>
        <div class="stat-label">Total Exercises</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.completionRate}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.averageRating}/5</div>
        <div class="stat-label">Average Rating</div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Progress Overview</h3>
      <div style="margin: 20px 0;">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${statistics.completionRate}%"></div>
        </div>
        <p style="margin-top: 10px; color: #64748b; font-size: 14px;">
          ${statistics.completedSchedules} of ${statistics.totalSchedules} scheduled sessions completed
        </p>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">Category Distribution</h3>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Completed Exercises</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(progressByCategory).map(([category, count]) => `
            <tr>
              <td>${category}</td>
              <td>${count}</td>
              <td>${((count / statistics.totalExercises) * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h3 class="section-title">Recent Activities</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Exercise</th>
            <th>Category</th>
            <th>Rating</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${recentProgress.map(p => `
            <tr>
              <td>${new Date(p.completionDate).toLocaleDateString()}</td>
              <td>${p.video?.title || 'Unknown'}</td>
              <td>${p.video?.category?.name || 'Uncategorized'}</td>
              <td>${p.rating ? `${p.rating}/5` : '-'}</td>
              <td>${p.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${upcomingSchedules.length > 0 ? `
    <div class="section">
      <h3 class="section-title">Upcoming Sessions</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Exercise</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          ${upcomingSchedules.map(s => `
            <tr>
              <td>${new Date(s.scheduledDate).toLocaleDateString()}</td>
              <td>${new Date(s.scheduledDate).toLocaleTimeString()}</td>
              <td>${s.video?.title || 'Unknown'}</td>
              <td>${s.video?.category?.name || 'Uncategorized'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>This report was automatically generated by the Rehabilitation Platform</p>
      <p>© ${new Date().getFullYear()} Rehabilitation Management System</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const printReport = () => {
    if (!selectedPatient || !patientProgress) return;
    
    const reportContent = createReportContent();
    const html = generateHTMLReport(reportContent);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Reports</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive progress reports for patients</p>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Patient</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {patients.map(patient => (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedPatient?.id === patient.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                  </div>
                  {selectedPatient?.id === patient.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              >
                <option value="comprehensive">Comprehensive Report</option>
                <option value="summary">Summary Report</option>
                <option value="progress">Progress Only</option>
                <option value="schedule">Schedule Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="includeCharts" className="text-sm text-gray-700">
                Include visual charts
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
          {selectedPatient ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Selected Patient</p>
                <p className="text-lg font-semibold text-blue-900">{selectedPatient.name}</p>
                <p className="text-sm text-blue-700">{selectedPatient.email}</p>
              </div>
              
              <button
                onClick={generateReport}
                disabled={loading || generating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Report
                  </>
                )}
              </button>
              
              <button
                onClick={printReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Report
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Please select a patient to generate report</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Data Preview */}
      {selectedPatient && patientProgress && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Exercises</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientProgress?.progress?.length || 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Scheduled Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientSchedules.length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientSchedules.filter(s => s.completed).length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {patientSchedules.length > 0 
                  ? Math.round((patientSchedules.filter(s => s.completed).length / patientSchedules.length) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
          
          {/* Recent Progress Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exercise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patientProgress?.progress?.slice(0, 5).map((progress) => (
                  <tr key={progress.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(progress.completionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {progress.video?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {progress.video?.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {progress.rating ? `${progress.rating}/5` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {progress.notes || '-'}
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
