import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from './axios';
import { format } from 'date-fns';
import ScreenShare from './ScreenShare';

const ChatPage = () => {
  const { friendEmail } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [friendUsername, setFriendUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState(30); // Default 30 minutes
  const [scheduledMeeting, setScheduledMeeting] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const chatRef = useRef(null);
  
  // Helper function to safely parse dates
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
  
  // Generate time slots for the next 7 days, 8AM to 10PM (IST)
  const generateTimeSlots = () => {
    const slots = [];
    
    // Get current IST time properly
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const startHour = 8;
    const endHour = 22; // 10 PM
    
    for (let i = 0; i < 7; i++) {
      // Create date in IST
      const date = new Date(istNow);
      date.setDate(istNow.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      // Format date as YYYY-MM-DD in IST
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const isToday = i === 0;
      
      if (isToday) {
        // For today, only show future times
        const currentHour = istNow.getHours();
        const currentMinute = istNow.getMinutes();
        
        console.log(`Current IST time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
        
        // Start from next hour
        let startFrom = currentHour + 1;
        
        // Don't show times before business hours
        if (startFrom < startHour) {
          startFrom = startHour;
        }
        
        console.log(`Today's available times starting from: ${startFrom}:00`);
        
        for (let h = startFrom; h <= endHour; h++) {
          slots.push({
            date: dateStr,
            time: `${h.toString().padStart(2, '0')}:00`,
            display: `${h}:00`
          });
        }
      } else {
        // For future days, show all business hours
        for (let h = startHour; h <= endHour; h++) {
          slots.push({
            date: dateStr,
            time: `${h.toString().padStart(2, '0')}:00`,
            display: `${h}:00`
          });
        }
      }
    }
    
    console.log('Generated slots for dates:', slots.map(s => s.date).filter((v, i, a) => a.indexOf(v) === i));
    return slots;
  };
  
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Regenerate time slots every minute to keep them current
  useEffect(() => {
    const updateTimeSlots = () => {
      setTimeSlots(generateTimeSlots());
    };
    
    // Initial generation
    updateTimeSlots();
    
    // Update every minute
    const interval = setInterval(updateTimeSlots, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const [showWarning, setShowWarning] = useState(false);
  
  const handleScheduleCall = async () => {
    if (!scheduledDate || !scheduledTime) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }
    
    const [hours] = scheduledTime.split(':').map(Number);
    const [year, month, day] = scheduledDate.split('-').map(Number);
    
    
    // Create datetime in IST - NO timezone conversion
    const scheduledDateTime = new Date(year, month - 1, day, hours, 0, 0, 0);
    
    // Verify this is in the future using IST
    const istNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    if (scheduledDateTime <= istNow) {
      alert('Please select a future time');
      return;
    }
    
    // Format as LocalDateTime for backend (YYYY-MM-DDTHH:mm:ss)
    const formattedDateTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:00:00`;
    
    
    const requestData = {
      receiverEmail: friendEmail,
      scheduledDateTime: formattedDateTime,
      duration: parseInt(duration)
    };
    
    // Validate meeting timing
    try {
      // Send video call request to backend
      const response = await api.post('/api/video-call/request', requestData);
      
      // Update local state with the response from backend (which includes the ID and proper data)
      setPendingRequest(response.data);
      
      setShowVideoCallModal(false);
      setScheduledDate('');
      setScheduledTime('');
      setDuration(30);
      
      alert(`Video call request sent to ${friendUsername}!`);
    } catch (err) {
      alert(`Failed to send video call request: ${err.response?.data || err.message}`);
    }
  };
  
  const handleAcceptVideoCall = async (request) => {
    try {
      const response = await api.post(`/api/video-call/accept/${request.id || request.requestId}`);
      
      // Create scheduled meeting from response
      const meeting = response.data;
      setScheduledMeeting(meeting);
      setPendingRequest(null);
      
      // Show success message in chat style
      alert('✅ Video call scheduled successfully! Check your Meetings tab.');
      
      // Refresh data to get updated meetings
      await fetchData();
    } catch (err) {
      alert(`❌ Failed to accept video call: ${err.response?.data || err.message}`);
    }
  };
  
  const handleRejectVideoCall = async (request) => {
    try {
      await api.post(`/api/video-call/reject/${request.id || request.requestId}`);
      setPendingRequest(null);
      
      alert('Video call request declined.');
      
      // Refresh data
      await fetchData();
    } catch (err) {
      alert(`❌ Failed to decline video call: ${err.response?.data || err.message}`);
    }
  };
  
  const handleDeleteMeeting = async () => {
    if (!scheduledMeeting) return;
    
    try {
      await api.delete(`/api/video-call/meeting/${scheduledMeeting.id}`);
      setScheduledMeeting(null);
      // Silently delete - no alert needed
    } catch (err) {
      // Silently handle error - no alert needed
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const profileRes = await api.get('/api/user/profile');
      setUserProfile(profileRes.data);

      const friendsRes = await api.get('/api/friend/friends');
      const friend = friendsRes.data.find(f => f.email === friendEmail);
      if (friend) {
        setFriendUsername(friend.username);
      } else {
        setError('Friend not found');
        return;
      }

      const messagesRes = await api.get(`/api/messages/${friendEmail}`);
      setMessages(messagesRes.data || []);

      // Fetch video call requests and scheduled meetings
      try {
        // Get latest pending request between users
        const latestRequestRes = await api.get(`/api/video-call/requests/${friendEmail}/latest`);
        setPendingRequest(latestRequestRes.data || null);
        
        // Find scheduled meeting
        const meetingsRes = await api.get(`/api/video-call/meetings/${friendEmail}`);
        const meetings = meetingsRes.data || [];
        setScheduledMeeting(meetings[0] || null);
      } catch (err) {
        setPendingRequest(null);
        setScheduledMeeting(null);
      }

      await api.post(`/api/messages/mark-read/${friendEmail}`);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [friendEmail]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    try {
      await api.post('/api/message', { receiverEmail: friendEmail, content: messageInput });
      setMessageInput('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data || err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-morphism rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">💬</span>
        </div>
        <p className="text-white text-lg">Loading chat...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-morphism rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">⚠</span>
        </div>
        <p className="text-white text-lg">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto glass-morphism rounded-2xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">{friendUsername?.charAt(0)?.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Chat with {friendUsername}</h2>
        </div>
        <div ref={chatRef} className="h-96 overflow-y-auto mb-4 space-y-4 p-4 border border-red-600/30 rounded-xl bg-black/20 backdrop-blur-sm">
          {messages.length === 0 ? (
            <p className="text-center text-gray-300">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.senderEmail === userProfile.email;
              const senderName = isOwnMessage ? userProfile.username : friendUsername;
              return (
                <div key={index} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-md px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${isOwnMessage ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500/30' : 'bg-black/40 text-white border-red-600/30'}`}>
                    <p className="text-sm font-semibold mb-1 opacity-80">{senderName}</p>
                    <p className="text-base">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                </div>
              );
            })
          )}
        </div>
        {/* Video Call Requests in Chat */}
        {pendingRequest && (
          <div className="mb-4">
            <div className={`flex ${pendingRequest.senderEmail === userProfile.email ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-4 rounded-xl shadow-lg backdrop-blur-sm border ${
                pendingRequest.senderEmail === userProfile.email 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500/30' 
                  : 'bg-yellow-600/20 text-white border-yellow-600/30'
              }`}>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h4 className="font-medium">
                    {pendingRequest.senderEmail === userProfile.email 
                      ? 'Screen Share Request Sent' 
                      : 'Screen Share Request'
                    }
                  </h4>
                </div>
                <p className="text-sm mb-3">
                  {(() => {
                    const parsedDate = safeParseDate(pendingRequest.scheduledDateTime);
                    return parsedDate ? (
                      <>
                        📅 {format(parsedDate, 'PPP')}<br/>
                        🕐 {format(parsedDate, 'p')} ({pendingRequest.duration} min)
                      </>
                    ) : (
                      <span className="text-gray-400">Date/Time not available</span>
                    );
                  })()}
                </p>
                
                {pendingRequest.senderEmail !== userProfile.email && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptVideoCall(pendingRequest)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleRejectVideoCall(pendingRequest)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      ✗ Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Meeting Display */}
        {scheduledMeeting && (() => {
          const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
          const meetingStart = safeParseDate(scheduledMeeting.scheduledDateTime);
          
          // If we can't parse the meeting start time, don't show the meeting
          if (!meetingStart) {
            return null;
          }
          
          const meetingEnd = new Date(meetingStart.getTime() + (scheduledMeeting.duration * 60 * 1000));
          
          const isFuture = now < meetingStart;
          const isActive = now >= meetingStart && now <= meetingEnd;
          const isCompleted = now > meetingEnd;
          
          // Don't display completed meetings - they should be deleted from backend
          if (isCompleted) {
            return null;
          }
          
          const getStatusColor = () => {
            if (isFuture) return 'blue-600/20 border-blue-600/30';
            if (isActive) return 'green-600/20 border-green-600/30';
            return 'gray-600/20 border-gray-600/30';
          };
          
          const getStatusText = () => {
            if (isFuture) return 'Upcoming Meeting';
            return 'Meeting Active - Join Now!';
          };
          
          return (
            <div className={`mb-4 p-4 bg-${getStatusColor()} rounded-xl`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">{getStatusText()}</h4>
                  <p className="text-white/70 text-sm">
                    {(() => {
                      const parsedDate = safeParseDate(scheduledMeeting.scheduledDateTime);
                      return parsedDate ? (
                        <>{format(parsedDate, 'PPPp')} • {scheduledMeeting.duration} minutes</>
                      ) : (
                        <span className="text-gray-400">Date/Time not available</span>
                      );
                    })()}
                  </p>
                  {isFuture && (
                    <p className="text-blue-400 text-xs mt-1">
                      Starts in {Math.ceil((meetingStart - now) / (1000 * 60))} minutes
                    </p>
                  )}
                  {isActive && (
                    <p className="text-green-400 text-xs mt-1 animate-pulse">
                      Meeting is live! Ends in {Math.ceil((meetingEnd - now) / (1000 * 60))} minutes
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isActive && (
                    <button 
                      onClick={() => setIsInVideoCall(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors animate-pulse"
                    >
                      Join Session
                    </button>
                  )}
                  {(isFuture || isActive) && (
                    <button
                      onClick={handleDeleteMeeting}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Screen Share Component */}
        {isInVideoCall && scheduledMeeting && (
          <ScreenShare 
            meeting={scheduledMeeting}
            currentUserEmail={userProfile?.email}
            onEndCall={() => setIsInVideoCall(false)}
          />
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowVideoCallModal(true)}
            className={`flex items-center justify-center p-3 rounded-xl transition-colors duration-200 ${
              scheduledMeeting || pendingRequest 
                ? 'bg-gray-600/20 border border-gray-600/30 cursor-not-allowed opacity-50'
                : 'bg-red-600/20 border border-red-600/30 hover:bg-red-600/30'
            }`}
            title={scheduledMeeting || pendingRequest ? 'Cannot schedule - session exists or request pending' : 'Schedule Screen Share'}
            disabled={!!(scheduledMeeting || pendingRequest)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 border border-red-600/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-black/30 text-white placeholder-gray-400 backdrop-blur-sm"
            placeholder="Type a message..."
          />
          <button
            className="btn-gradient text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
        
        {/* Video Call Scheduling Modal */}
        {showVideoCallModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-red-600/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Schedule Screen Share Session</h3>
                <button 
                  onClick={() => setShowVideoCallModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {showWarning && (
            <div className="bg-yellow-500/20 border-l-4 border-yellow-500 p-4 mb-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-100">
                    Please select both date and time to schedule the call
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <select
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a date</option>
                    {Array.from(new Set(timeSlots.map(slot => slot.date))).map((date, index) => {
                      const dateObj = new Date(date + 'T00:00:00');
                      const isToday = index === 0;
                      return (
                        <option key={date} value={date}>
                          {isToday ? 'Today' : format(dateObj, 'EEEE, MMMM d')}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {scheduledDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select a time</option>
                      {timeSlots
                        .filter(slot => slot.date === scheduledDate)
                        .map((slot, index) => (
                          <option key={index} value={slot.time}>
                            {slot.time}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duration: {duration} minutes
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>15 min</span>
                    <span>30 min</span>
                    <span>45 min</span>
                    <span>60 min</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={handleScheduleCall}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Send Video Call Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
