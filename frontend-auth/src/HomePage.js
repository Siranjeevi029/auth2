import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from './axios';
import ScreenShare from './ScreenShare';

// Helper function to safely parse dates (same as in ChatPage)
const safeParseDate = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    let date;
    
    // Handle array format [year, month, day, hour, minute]
    if (Array.isArray(dateInput) && dateInput.length >= 5) {
      // Note: JavaScript Date constructor expects month to be 0-based, but our array is 1-based
      date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3], dateInput[4]);
    } 
    // Handle string format
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    }
    // Handle other formats
    else {
      date = new Date(dateInput);
    }
    
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

const HomePage = ({ setErrorMessage }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadFriendRequests, setUnreadFriendRequests] = useState(0);
  const [unreadMessagesPerFriend, setUnreadMessagesPerFriend] = useState({});
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const unreadNotifications = 0;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const profileRes = await api.get('/api/user/profile');
      setUserProfile(profileRes.data);

      const matchesRes = await api.get('/api/users/matches');
      setMatches(matchesRes.data.matches || []);

      const requestsRes = await api.get('/api/friend/requests');
      const sortedRequests = (requestsRes.data || []).sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
      setFriendRequests(sortedRequests);

      const friendsRes = await api.get('/api/friend/friends');
      
      // Get last message timestamps for each friend to sort by most recent activity
      const friendsWithLastMessage = await Promise.all(
        (friendsRes.data || []).map(async (friend) => {
          try {
            const messagesRes = await api.get(`/api/messages/${friend.email}`);
            const messages = messagesRes.data || [];
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            return {
              ...friend,
              lastMessageTimestamp: lastMessage ? new Date(lastMessage.timestamp) : new Date(0)
            };
          } catch (err) {
            return {
              ...friend,
              lastMessageTimestamp: new Date(0)
            };
          }
        })
      );
      
      // Sort friends by most recent message
      const sortedFriends = friendsWithLastMessage.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
      setFriends(sortedFriends);
      
      const unreadRequestsRes = await api.get('/api/friend/requests/unread-count');
      setUnreadFriendRequests(unreadRequestsRes.data.count || 0);

      try {
        const unreadCountsPerFriendRes = await api.get('/api/messages/unread-counts-per-friend');
        setUnreadMessagesPerFriend(unreadCountsPerFriendRes.data || {});
      } catch (err) {
        setUnreadMessagesPerFriend({});
      }
      
      // Fetch all scheduled video meetings
      try {
        const meetingsRes = await api.get('/api/video-call/meetings');
        setScheduledMeetings(meetingsRes.data || []);
      } catch (err) {
        setScheduledMeetings([]);
      }
    } catch (err) {
      setError(err.response?.data || err.message);
      setErrorMessage('Failed to load homepage data');
    } finally {
      setLoading(false);
    }
  }, [setErrorMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendFriendRequest = async (receiverEmail) => {
    try {
      const res = await api.post('/api/friend/request', { receiverEmail });
      alert(res.data);
      await fetchData();
    } catch (err) {
      alert(err.response?.data || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.post(`/api/friend/request/${requestId}/accept`);
      alert(res.data);
      await fetchData();
    } catch (err) {
      alert(err.response?.data || 'Failed to accept friend request');
      setError(err.response?.data || err.message);
      setErrorMessage('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const res = await api.post(`/api/friend/request/${requestId}/reject`);
      alert(res.data);
      await fetchData();
    } catch (err) {
      setError(err.response?.data || err.message);
      setErrorMessage('Failed to reject friend request');
    }
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadMessagesPerFriend).reduce((total, friend) => {
      return total + (friend.unreadCount || 0);
    }, 0);
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'requests') {
      try {
        await api.post('/api/friend/requests/mark-read');
        setUnreadFriendRequests(0);
        const requestsRes = await api.get('/api/friend/requests');
        setFriendRequests(requestsRes.data || []);
      } catch (err) {
        // Silently handle error
      }
    }
  };

  const UserCard = ({ user }) => (
    <div className="glass-morphism rounded-2xl p-6 card-hover animate-fadeInUp backdrop-blur-sm border border-white/20">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">{user.username?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{user.username}</h3>
          <p className="text-white/60 text-sm">Skill Matcher</p>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-white/80 text-sm">
            <span className="font-medium text-green-300">Offers:</span> {user.skillsOffered?.join(', ') || 'None'}
          </p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-white/80 text-sm">
            <span className="font-medium text-blue-300">Wants:</span> {user.skillsWanted?.join(', ') || 'None'}
          </p>
        </div>
        {user.bio && (
          <p className="text-white/70 text-sm italic">{user.bio}</p>
        )}
      </div>
      
      <div className="flex gap-3">
        <Link
          to={`/profile/${user.id}`}
          className="flex-1 bg-white/20 hover:bg-white/30 text-white text-center px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
        >
          View Profile
        </Link>
        <button
          className="flex-1 btn-gradient text-white px-4 py-2 rounded-xl font-medium transition-all duration-300"
          onClick={() => handleSendFriendRequest(user.email)}
        >
          Connect
        </button>
      </div>
    </div>
  );

  const NotificationCard = ({ request }) => (
    <div className="glass-morphism rounded-2xl p-6 flex justify-between items-center card-hover animate-fadeInUp backdrop-blur-sm border border-white/20">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">{request.senderUsername?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-white font-medium">New Connection Request</p>
          <p className="text-white/70 text-sm">From: {request.senderUsername}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          className="bg-green-500/80 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
          onClick={() => handleAcceptRequest(request.requestId)}
        >
          ✓ Accept
        </button>
        <button
          className="bg-red-500/80 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
          onClick={() => handleRejectRequest(request.requestId)}
        >
          ✗ Decline
        </button>
      </div>
    </div>
  );

  const MeetingCard = ({ meeting }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    const formatDateTime = (dateTimeInput) => {
      const date = safeParseDate(dateTimeInput);
      if (!date) return 'Date not available';
      
      const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString(undefined, options);
    };
    
    const handleDeleteMeeting = async () => {
      if (!window.confirm('Are you sure you want to delete this meeting?')) return;
      
      try {
        await api.delete(`/api/video-call/meeting/${meeting.id}`);
        // Refresh the meetings list
        const meetingsRes = await api.get('/api/video-call/meetings');
        setScheduledMeetings(meetingsRes.data || []);
        // Silently delete - no alert needed
      } catch (err) {
        console.error('Failed to delete meeting:', err);
        // Silently handle error - no alert needed
      }
    };
    
    const handleJoinMeeting = () => {
      setCurrentMeeting(meeting);
      setIsInVideoCall(true);
    };
    
    const getOtherParticipant = () => {
      return meeting.participants?.find(email => email !== userProfile?.email) || 'Unknown';
    };
    
    // Check meeting status
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const meetingStart = safeParseDate(meeting.scheduledDateTime);
    
    // If we can't parse the meeting start time, treat as invalid
    if (!meetingStart) {
      return (
        <div className="glass-morphism rounded-2xl p-6 card-hover animate-fadeInUp backdrop-blur-sm border border-white/20">
          <div className="text-center text-white/70">
            <p>Invalid meeting data</p>
          </div>
        </div>
      );
    }
    
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration * 60 * 1000));
    const isFuture = now < meetingStart;
    const isCompleted = now > meetingEnd;
    
    // Don't display completed meetings - they should be deleted from backend
    if (isCompleted) {
      return null;
    }
    
    const getStatusInfo = () => {
      if (isFuture) {
        const minutesToStart = Math.ceil((meetingStart - now) / (1000 * 60));
        return {
          color: 'blue',
          text: `Starts in ${minutesToStart} minutes`,
          canJoin: false
        };
      }
      // If we reach here, it must be active (since completed meetings are filtered out)
      const minutesToEnd = Math.ceil((meetingEnd - now) / (1000 * 60));
      return {
        color: 'green',
        text: `Live! Ends in ${minutesToEnd} minutes`,
        canJoin: true
      };
    };
    
    const status = getStatusInfo();

    return (
      <div className="glass-morphism rounded-2xl p-6 card-hover animate-fadeInUp backdrop-blur-sm border border-white/20">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {meeting.title || `Meeting with ${getOtherParticipant()}`}
            </h3>
            <div className="flex items-center text-white/80 text-sm mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateTime(meeting.scheduledDateTime)}
            </div>
            <div className="flex items-center text-white/70 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {meeting.duration} minutes
            </div>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetails ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        </div>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-white/80 mb-2">Participants:</h4>
            <div className="space-y-2">
              {meeting.participants?.map((email, idx) => (
                <div key={idx} className="flex items-center text-white/70 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                  {email === userProfile?.email ? 'You' : email}
                </div>
              )) || (
                <div className="text-white/50 text-sm">No participants listed</div>
              )}
            </div>
            <div className="mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                status.color === 'blue' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' :
                status.color === 'green' ? 'bg-green-600/20 text-green-400 border border-green-600/30 animate-pulse' :
                'bg-gray-600/20 text-gray-400 border border-gray-600/30'
              }`}>
                {status.text}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              {status.canJoin && (
                <button 
                  onClick={handleJoinMeeting}
                  className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors border border-green-600/30 animate-pulse"
                >
                  Join Session
                </button>
              )}
              <button 
                onClick={handleDeleteMeeting}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors border border-red-600/30"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FriendCard = ({ friend }) => {
    const unreadCount = unreadMessagesPerFriend[friend.email]?.unreadCount || 0;
    const lastMessage = unreadMessagesPerFriend[friend.email]?.lastMessage;
    const lastMessageTimestamp = unreadMessagesPerFriend[friend.email]?.lastMessageTimestamp;

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      return isToday
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
      <Link
        to={`/chat/${friend.email}`}
        className="glass-morphism rounded-2xl p-4 flex items-center gap-4 card-hover animate-fadeInUp backdrop-blur-sm border border-white/20 relative"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">{friend.username.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">{friend.username}</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse-gentle">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-white/70 text-sm truncate max-w-[200px]">
            {lastMessage ? (
              <>
                {lastMessage.substring(0, 35)}
                {lastMessage.length > 35 ? '...' : ''}
              </>
            ) : (
              'Start a conversation'
            )}
          </p>
          {lastMessageTimestamp && (
            <p className="text-white/50 text-xs">{formatTimestamp(lastMessageTimestamp)}</p>
          )}
        </div>
        <div className="text-white/40">
          💬
        </div>
      </Link>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fadeInUp">
        <div className="loading-shimmer w-16 h-16 rounded-2xl mx-auto mb-4"></div>
        <p className="text-white/80 text-lg">Loading your dashboard...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-morphism rounded-2xl p-8 text-center animate-fadeInUp">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">⚠</span>
        </div>
        <p className="text-white text-lg">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {userProfile && (
          <div className="mb-8 glass-morphism rounded-2xl p-8 animate-fadeInUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{userProfile.username?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {userProfile.username}!</h1>
                  <p className="text-white/80">Ready to connect and learn?</p>
                </div>
              </div>
              <Link 
                to="/editprofile" 
                className="bg-red-600/20 hover:bg-red-600/30 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-red-600/30"
              >
                Edit Profile
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-red-600/30">
                <h3 className="text-white font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Your Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skillsOffered && userProfile.skillsOffered.length > 0 ? (
                    userProfile.skillsOffered.map((skill, index) => (
                      <span key={index} className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-sm font-medium border border-red-500/30">
                        {typeof skill === 'object' ? skill.name : skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/60 text-sm">No skills added yet</span>
                  )}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-red-600/30">
                <h3 className="text-white font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Learning Goals
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skillsWanted && userProfile.skillsWanted.length > 0 ? (
                    userProfile.skillsWanted.map((goal, index) => (
                      <span key={index} className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                        {typeof goal === 'object' ? goal.name : goal}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/60 text-sm">No learning goals set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 glass-morphism rounded-2xl p-2 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
          <div className="flex gap-2">
            <button
              className={`flex-1 relative py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'matches' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-red-600/10'
              }`}
              onClick={() => setActiveTab('matches')}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🎯</span>
                <span>Skill Matches</span>
                {matches.length > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full ml-2">
                    {matches.length}
                  </span>
                )}
              </span>
            </button>
            <button
              className={`flex-1 relative py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'requests' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-red-600/10'
              }`}
              onClick={() => handleTabChange('requests')}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>📩</span>
                <span>Friend Requests</span>
              </span>
              {unreadFriendRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse-gentle">
                  {unreadFriendRequests}
                </span>
              )}
            </button>
            <button
              className={`flex-1 relative py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'notifications' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-red-600/10'
              }`}
              onClick={() => handleTabChange('notifications')}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🔔</span>
                <span>Notifications</span>
              </span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse-gentle">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button
              className={`flex-1 relative py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'friends' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-red-600/10'
              }`}
              onClick={() => handleTabChange('friends')}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>👥</span>
                <span>Friends</span>
              </span>
              {getTotalUnreadCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse-gentle">
                  {getTotalUnreadCount()}
                </span>
              )}
            </button>
            <button
              className={`flex-1 relative py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'meetings' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-red-600/10'
              }`}
              onClick={() => setActiveTab('meetings')}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🎥</span>
                <span>Meetings</span>
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'matches' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Matches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.length > 0 ? (
                matches.map((user) => <UserCard key={user.id} user={user} />)
              ) : (
                <p className="text-gray-300 text-center">No matches found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Friend Requests</h2>
            <div className="grid grid-cols-1 gap-4">
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => <NotificationCard key={request.requestId} request={request} />)
              ) : (
                <p className="text-gray-300 text-center">No pending friend requests.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
            <div className="grid grid-cols-1 gap-4">
              <p className="text-gray-300 text-center">No notifications yet.</p>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Friends</h2>
            <div className="grid grid-cols-1 gap-3">
              {friends.length > 0 ? (
                friends.map((friend) => <FriendCard key={friend.email} friend={friend} />)
              ) : (
                <p className="text-gray-300 text-center">No friends yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Scheduled Screen Share Sessions</h2>
            
            {/* Screen Share Component */}
            {isInVideoCall && currentMeeting && (
              <ScreenShare 
                meeting={currentMeeting}
                currentUserEmail={userProfile?.email}
                onEndCall={() => {
                  setIsInVideoCall(false);
                  setCurrentMeeting(null);
                }}
              />
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {scheduledMeetings.length > 0 ? (
                scheduledMeetings
                  .sort((a, b) => {
                    const dateA = safeParseDate(a.scheduledDateTime);
                    const dateB = safeParseDate(b.scheduledDateTime);
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return dateA - dateB;
                  })
                  .map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-white/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-white/70 mb-1">No sessions scheduled yet</h3>
                  <p className="text-white/50 text-sm">Schedule screen share sessions from your chat window</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
