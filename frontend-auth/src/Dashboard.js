import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalConnections: 0,
    pendingRequests: 0,
    skillMatches: 0,
    messagesCount: 0,
    meetingsToday: 0,
    profileViews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth] = useState({
    status: 'online',
    lastSync: new Date(),
    notifications: true
  });

  const fetchStats = useCallback(async () => {
    try {
      // Fetch various statistics from different endpoints
      const [friendsRes, requestsRes, matchesRes, messagesRes] = await Promise.all([
        api.get('/api/friend/friends').catch(() => ({ data: [] })),
        api.get('/api/friend/requests').catch(() => ({ data: [] })),
        api.get('/api/users/matches').catch(() => ({ data: { matches: [] } })),
        api.get('/api/messages/unread-count').catch(() => ({ data: { count: 0 } }))
      ]);

      setDashboardStats({
        totalConnections: friendsRes.data?.length || 0,
        pendingRequests: requestsRes.data?.length || 0,
        skillMatches: matchesRes.data?.matches?.length || 0,
        messagesCount: messagesRes.data?.count || 0,
        meetingsToday: Math.floor(Math.random() * 3), // Mock data
        profileViews: Math.floor(Math.random() * 50) + 10 // Mock data
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const generateRecentActivity = useCallback(() => {
    const activities = [
      { id: 1, type: 'connection', message: 'New connection request received', time: '2 minutes ago', icon: '👥' },
      { id: 2, type: 'message', message: 'New message from John Doe', time: '15 minutes ago', icon: '💬' },
      { id: 3, type: 'match', message: 'Found 3 new skill matches', time: '1 hour ago', icon: '🎯' },
      { id: 4, type: 'profile', message: 'Profile viewed by 5 users', time: '2 hours ago', icon: '👁️' },
      { id: 5, type: 'meeting', message: 'Upcoming meeting in 30 minutes', time: '3 hours ago', icon: '🎥' }
    ];
    setRecentActivity(activities);
  }, []);

  const generateQuickStats = useCallback(() => {
    const stats = [
      { label: 'Response Rate', value: '95%', trend: 'up', color: 'green' },
      { label: 'Avg. Session Time', value: '45m', trend: 'up', color: 'blue' },
      { label: 'Skills Taught', value: '12', trend: 'stable', color: 'purple' },
      { label: 'Skills Learning', value: '8', trend: 'up', color: 'orange' }
    ];
    setQuickStats(stats);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileRes = await api.get('/api/user/profile');
      setUserProfile(profileRes.data);

      // Fetch dashboard statistics
      await fetchStats();
      
      // Generate recent activity (mock data for now)
      generateRecentActivity();
      
      // Generate quick stats
      generateQuickStats();
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, generateRecentActivity, generateQuickStats]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon, color = 'red', trend }) => (
    <div className="glass-morphism rounded-2xl p-6 card-hover animate-fadeInUp backdrop-blur-sm border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              <span className="mr-1">
                {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}
              </span>
              <span>{trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center border border-${color}-500/30`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon, onClick, color = 'red' }) => (
    <button
      onClick={onClick}
      className="glass-morphism rounded-2xl p-6 card-hover animate-fadeInUp backdrop-blur-sm border border-white/20 text-left w-full hover:scale-105 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center border border-${color}-500/30`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-white/70 text-sm">{description}</p>
        </div>
      </div>
    </button>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
        <span className="text-sm">{activity.icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-white text-sm">{activity.message}</p>
        <p className="text-white/50 text-xs">{activity.time}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="loading-shimmer w-16 h-16 rounded-2xl mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 glass-morphism rounded-2xl p-8 animate-fadeInUp">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">{userProfile?.username?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-white/80">Welcome back, {userProfile?.username}! Here's your overview.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'online' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
              <span className="text-white/70 text-sm">System {systemHealth.status}</span>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard title="Total Connections" value={dashboardStats.totalConnections} icon="👥" color="blue" trend="up" />
          <StatCard title="Pending Requests" value={dashboardStats.pendingRequests} icon="📩" color="yellow" />
          <StatCard title="Skill Matches" value={dashboardStats.skillMatches} icon="🎯" color="green" trend="up" />
          <StatCard title="Unread Messages" value={dashboardStats.messagesCount} icon="💬" color="purple" />
          <StatCard title="Meetings Today" value={dashboardStats.meetingsToday} icon="🎥" color="indigo" />
          <StatCard title="Profile Views" value={dashboardStats.profileViews} icon="👁️" color="pink" trend="up" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="glass-morphism rounded-2xl p-6 animate-fadeInUp backdrop-blur-sm border border-white/20">
              <div className="text-center">
                <p className="text-white/70 text-sm">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>{stat.value}</p>
                <div className={`flex items-center justify-center mt-2 text-sm ${
                  stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  <span className="mr-1">
                    {stat.trend === 'up' ? '↗️' : stat.trend === 'down' ? '↘️' : '➡️'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActionCard
                title="Find Skill Matches"
                description="Discover people with complementary skills"
                icon="🔍"
                onClick={() => navigate('/home')}
                color="blue"
              />
              <QuickActionCard
                title="Schedule Meeting"
                description="Set up a new learning session"
                icon="📅"
                onClick={() => navigate('/home')}
                color="green"
              />
              <QuickActionCard
                title="Update Profile"
                description="Edit your skills and preferences"
                icon="✏️"
                onClick={() => navigate('/editprofile')}
                color="purple"
              />
              <QuickActionCard
                title="View Analytics"
                description="See your learning progress"
                icon="📊"
                onClick={() => navigate('/analytics')}
                color="orange"
              />
              <QuickActionCard
                title="Generate Reports"
                description="Download your activity report"
                icon="📥"
                onClick={() => navigate('/reports')}
                color="indigo"
              />
              <QuickActionCard
                title="Settings"
                description="Manage your account preferences"
                icon="⚙️"
                onClick={() => navigate('/settings')}
                color="gray"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                  to="/home"
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  View all activity →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 glass-morphism rounded-2xl p-6 animate-fadeInUp backdrop-blur-sm border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80">All systems operational</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-white/80">Last sync: {systemHealth.lastSync.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${systemHealth.notifications ? 'bg-green-400' : 'bg-gray-400'} rounded-full`}></div>
              <span className="text-white/80">Notifications {systemHealth.notifications ? 'enabled' : 'disabled'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
