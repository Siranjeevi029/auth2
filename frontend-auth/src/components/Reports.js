import React, { useState, useEffect } from 'react';

const Reports = () => {
  const [reportData, setReportData] = useState({
    summary: {
      totalSessions: 0,
      totalHours: 0,
      skillsLearned: 0,
      connectionsGained: 0
    },
    monthlyProgress: [],
    skillBreakdown: [],
    connectionActivity: [],
    learningGoals: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data generation - replace with actual API calls
      generateMockReportData();
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = () => {
    const summary = {
      totalSessions: 47,
      totalHours: 156,
      skillsLearned: 12,
      connectionsGained: 23
    };

    const monthlyProgress = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
      sessions: Math.floor(Math.random() * 20) + 5,
      hours: Math.floor(Math.random() * 40) + 10,
      connections: Math.floor(Math.random() * 8) + 2
    }));

    const skillBreakdown = [
      { skill: 'JavaScript', sessions: 15, hours: 45, proficiency: 85 },
      { skill: 'React', sessions: 12, hours: 38, proficiency: 70 },
      { skill: 'Python', sessions: 8, hours: 28, proficiency: 60 },
      { skill: 'Node.js', sessions: 7, hours: 25, proficiency: 55 },
      { skill: 'MongoDB', sessions: 5, hours: 20, proficiency: 40 }
    ];

    const connectionActivity = [
      { type: 'Friend Request Sent', count: 15, percentage: 65 },
      { type: 'Friend Request Received', count: 12, percentage: 52 },
      { type: 'Messages Sent', count: 234, percentage: 89 },
      { type: 'Messages Received', count: 198, percentage: 76 },
      { type: 'Meetings Scheduled', count: 18, percentage: 72 }
    ];

    const learningGoals = [
      { goal: 'Master React Hooks', progress: 85, target: 100, deadline: '2024-12-31' },
      { goal: 'Learn TypeScript', progress: 60, target: 100, deadline: '2024-11-30' },
      { goal: 'Build Full-Stack App', progress: 40, target: 100, deadline: '2025-01-15' },
      { goal: 'Contribute to Open Source', progress: 25, target: 100, deadline: '2024-12-15' }
    ];

    setReportData({
      summary,
      monthlyProgress,
      skillBreakdown,
      connectionActivity,
      learningGoals
    });
  };

  const exportReport = async (format) => {
    try {
      setExporting(true);
      
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock data for download
      const reportContent = {
        generatedAt: new Date().toISOString(),
        period: selectedPeriod,
        type: reportType,
        data: reportData
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillconnect-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Simple CSV export for skills data
        const csvContent = [
          ['Skill', 'Sessions', 'Hours', 'Proficiency'],
          ...reportData.skillBreakdown.map(skill => [skill.skill, skill.sessions, skill.hours, skill.proficiency])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillconnect-skills-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      alert(`Report exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const SummaryCard = ({ title, value, unit, icon, color = 'red', change }) => (
    <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {value}<span className="text-lg text-white/70">{unit}</span>
          </p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              <span className="mr-1">
                {change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'}
              </span>
              <span>{Math.abs(change)}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center border border-${color}-500/30`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ progress, target, color = 'red' }) => (
    <div className="w-full bg-white/10 rounded-full h-3">
      <div 
        className={`bg-${color}-500 h-3 rounded-full transition-all duration-500 relative`}
        style={{ width: `${Math.min((progress / target) * 100, 100)}%` }}
      >
        {progress >= target && (
          <div className="absolute right-0 top-0 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="loading-shimmer w-16 h-16 rounded-2xl mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Generating reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 glass-morphism rounded-2xl p-8 animate-fadeInUp">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Learning Reports</h1>
              <p className="text-white/80">Comprehensive insights into your learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm"
              >
                <option value="overview">Overview</option>
                <option value="skills">Skills Focus</option>
                <option value="connections">Connections</option>
                <option value="goals">Goals Progress</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportReport('json')}
              disabled={exporting}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-blue-600/30 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export JSON'}
            </button>
            <button
              onClick={() => exportReport('csv')}
              disabled={exporting}
              className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-green-600/30 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => alert('PDF export coming soon!')}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-purple-600/30"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard 
            title="Total Sessions" 
            value={reportData.summary.totalSessions} 
            unit="" 
            icon="📚" 
            color="blue"
            change={12}
          />
          <SummaryCard 
            title="Learning Hours" 
            value={reportData.summary.totalHours} 
            unit="h" 
            icon="⏱️" 
            color="green"
            change={8}
          />
          <SummaryCard 
            title="Skills Learned" 
            value={reportData.summary.skillsLearned} 
            unit="" 
            icon="🎯" 
            color="purple"
            change={25}
          />
          <SummaryCard 
            title="New Connections" 
            value={reportData.summary.connectionsGained} 
            unit="" 
            icon="🤝" 
            color="orange"
            change={15}
          />
        </div>

        {reportType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Progress Chart */}
            <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-6">Monthly Progress</h3>
              <div className="space-y-4">
                {reportData.monthlyProgress.slice(-6).map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{month.month}</span>
                      <span className="text-white/70 text-sm">{month.sessions} sessions</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(month.sessions / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Activity */}
            <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-6">Connection Activity</h3>
              <div className="space-y-4">
                {reportData.connectionActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{activity.type}</p>
                      <p className="text-white/60 text-sm">{activity.count} total</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${activity.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-white/70 text-sm w-12">{activity.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === 'skills' && (
          <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Skill Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 py-3">Skill</th>
                    <th className="text-left text-white/80 py-3">Sessions</th>
                    <th className="text-left text-white/80 py-3">Hours</th>
                    <th className="text-left text-white/80 py-3">Proficiency</th>
                    <th className="text-left text-white/80 py-3">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.skillBreakdown.map((skill, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="py-4">
                        <span className="text-white font-medium">{skill.skill}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-white/70">{skill.sessions}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-white/70">{skill.hours}h</span>
                      </td>
                      <td className="py-4">
                        <span className="text-white/70">{skill.proficiency}%</span>
                      </td>
                      <td className="py-4">
                        <div className="w-24">
                          <ProgressBar progress={skill.proficiency} target={100} color="red" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'goals' && (
          <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Learning Goals Progress</h3>
            <div className="space-y-6">
              {reportData.learningGoals.map((goal, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">{goal.goal}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/70 text-sm">{goal.progress}%</span>
                      <span className="text-white/50 text-xs">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ProgressBar progress={goal.progress} target={goal.target} color="green" />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-white/50">Progress: {goal.progress}/{goal.target}</span>
                    <span className={`${
                      goal.progress >= goal.target ? 'text-green-400' : 
                      goal.progress >= goal.target * 0.7 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {goal.progress >= goal.target ? '✅ Completed' : 
                       goal.progress >= goal.target * 0.7 ? '🟡 On Track' : '🔴 Behind'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="text-green-400 font-semibold">Strong Performance</p>
                  <p className="text-white/70 text-sm">You've exceeded your learning goals by 20% this month</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-blue-400 font-semibold">Consistent Growth</p>
                  <p className="text-white/70 text-sm">Your skill proficiency has improved by 15% on average</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-purple-400 font-semibold">Focus Area</p>
                  <p className="text-white/70 text-sm">JavaScript is your most active learning skill</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
