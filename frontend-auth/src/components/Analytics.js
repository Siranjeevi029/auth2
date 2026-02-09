import React, { useState, useEffect, useCallback } from 'react';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    weeklyActivity: [],
    skillProgress: [],
    connectionGrowth: [],
    learningStats: {
      hoursSpent: 0,
      skillsLearned: 0,
      sessionsCompleted: 0,
      averageRating: 0
    }
  });
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      generateMockData();
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, fetchAnalyticsData]);

  const generateMockData = () => {
    // Generate mock weekly activity data
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      sessions: Math.floor(Math.random() * 5) + 1,
      hours: Math.floor(Math.random() * 8) + 1
    }));

    // Generate mock skill progress
    const skillProgress = [
      { skill: 'JavaScript', progress: 85, trend: 'up' },
      { skill: 'React', progress: 70, trend: 'up' },
      { skill: 'Python', progress: 60, trend: 'stable' },
      { skill: 'Node.js', progress: 45, trend: 'up' },
      { skill: 'MongoDB', progress: 30, trend: 'down' }
    ];

    // Generate mock connection growth
    const connectionGrowth = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      connections: Math.floor(Math.random() * 3) + (i * 0.5)
    }));

    setAnalyticsData({
      weeklyActivity,
      skillProgress,
      connectionGrowth,
      learningStats: {
        hoursSpent: 42,
        skillsLearned: 8,
        sessionsCompleted: 23,
        averageRating: 4.7
      }
    });
  };

  const ProgressBar = ({ progress, color = 'red' }) => (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div 
        className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  const StatCard = ({ title, value, unit, icon, color = 'red' }) => (
    <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {value}<span className="text-lg text-white/70">{unit}</span>
          </p>
        </div>
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center border border-${color}-500/30`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading-shimmer w-16 h-16 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Hours Spent Learning" 
          value={analyticsData.learningStats.hoursSpent} 
          unit="h" 
          icon="⏱️" 
          color="blue" 
        />
        <StatCard 
          title="Skills Learned" 
          value={analyticsData.learningStats.skillsLearned} 
          unit="" 
          icon="🎯" 
          color="green" 
        />
        <StatCard 
          title="Sessions Completed" 
          value={analyticsData.learningStats.sessionsCompleted} 
          unit="" 
          icon="✅" 
          color="purple" 
        />
        <StatCard 
          title="Average Rating" 
          value={analyticsData.learningStats.averageRating} 
          unit="/5" 
          icon="⭐" 
          color="yellow" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity Chart */}
        <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Weekly Activity</h3>
          <div className="space-y-4">
            {analyticsData.weeklyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white/80 w-12">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(day.sessions / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white/70 text-sm w-16">{day.sessions} sessions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Progress */}
        <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">Skill Progress</h3>
          <div className="space-y-4">
            {analyticsData.skillProgress.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{skill.skill}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white/70 text-sm">{skill.progress}%</span>
                    <span className={`text-sm ${
                      skill.trend === 'up' ? 'text-green-400' : 
                      skill.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {skill.trend === 'up' ? '↗️' : skill.trend === 'down' ? '↘️' : '➡️'}
                    </span>
                  </div>
                </div>
                <ProgressBar progress={skill.progress} color="red" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection Growth Chart */}
      <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-6">Connection Growth (Last 30 Days)</h3>
        <div className="h-64 flex items-end space-x-1">
          {analyticsData.connectionGrowth.slice(-15).map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm transition-all duration-500 hover:from-red-500 hover:to-red-300"
                style={{ height: `${Math.max((data.connections / 10) * 100, 5)}%` }}
              ></div>
              <span className="text-white/50 text-xs mt-2 transform rotate-45 origin-left">
                {data.date.split('/').slice(0, 2).join('/')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="text-green-400 font-semibold">Great Progress!</p>
                <p className="text-white/70 text-sm">You've completed 15% more sessions this week</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-blue-400 font-semibold">Skill Focus</p>
                <p className="text-white/70 text-sm">JavaScript is your most improved skill</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="text-purple-400 font-semibold">Network Growth</p>
                <p className="text-white/70 text-sm">5 new connections this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
