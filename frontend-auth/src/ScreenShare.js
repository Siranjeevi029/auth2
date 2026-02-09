import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';

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

const ScreenShare = ({ meeting, onEndCall, currentUserEmail }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(true); // Enable demo mode for single-user testing
  const [simulatedRemoteScreen, setSimulatedRemoteScreen] = useState(null);

  const remoteScreenRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }), []);

  const simulateRemoteScreenShare = useCallback(() => {
    // Create a canvas to simulate remote screen content
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Draw simulated screen content
    const drawSimulatedScreen = () => {
      // Background
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Simulated browser window
      ctx.fillStyle = '#374151';
      ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
      
      // Address bar
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(70, 70, canvas.width - 140, 40);
      
      // Content area
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(70, 120, canvas.width - 140, canvas.height - 190);
      
      // Simulated text content
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.fillText('ðŸ–¥ï¸ Simulated Remote Screen Share', 100, 160);
      ctx.fillText('This is what the other user is sharing', 100, 190);
      ctx.fillText('â€¢ Document editing', 100, 220);
      ctx.fillText('â€¢ Code collaboration', 100, 250);
      ctx.fillText('â€¢ Presentation slides', 100, 280);
      
      // Animated element
      const time = Date.now() / 1000;
      const x = 100 + Math.sin(time) * 50;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, 320, 20, 20);
      ctx.fillStyle = '#000000';
      ctx.fillText('â† Animated cursor', x + 30, 335);
    };
    
    // Update canvas content periodically
    const updateInterval = setInterval(drawSimulatedScreen, 100);
    drawSimulatedScreen();
    
    // Convert canvas to video stream
    const stream = canvas.captureStream(30);
    setSimulatedRemoteScreen(stream);
    
    if (remoteScreenRef.current) {
      remoteScreenRef.current.srcObject = stream;
    }
    
    // Clean up on component unmount
    return () => clearInterval(updateInterval);
  }, []);

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  }, [localStream]);

  const initializeCall = useCallback(async () => {
    try {
      // Get audio only (no camera)
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });

      setLocalStream(audioStream);
      
      // Initialize peer connection
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      // Add audio track to peer connection
      audioStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, audioStream);
      });

      // Handle remote stream (screen share)
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteScreenRef.current) {
          remoteScreenRef.current.srcObject = remoteStream;
        }
        setIsConnected(true);
        setIsConnecting(false);
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('Connection state:', state);
        
        if (state === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (state === 'disconnected' || state === 'failed') {
          setIsConnected(false);
          setError('Connection lost. Please try rejoining the call.');
        }
      };

      // For demo purposes, simulate connection after 2 seconds
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        
        // In demo mode, simulate remote user joining
        if (demoMode) {
          setTimeout(() => {
            simulateRemoteScreenShare();
          }, 3000);
        }
      }, 2000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check permissions.');
      setIsConnecting(false);
    }
  }, [demoMode, simulateRemoteScreenShare, rtcConfig]);

  useEffect(() => {
    initializeCall();
    callStartTimeRef.current = Date.now();
    
    // Update call duration every second
    const durationInterval = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(durationInterval);
      cleanup();
    };
  }, [cleanup, initializeCall]);

  

  const startScreenShare = async () => {
    try {
      // Get available tabs/windows for screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false // We already have audio from microphone
      });

      // In demo mode, show your screen share in a small preview
      if (demoMode) {
        // Create a small preview of your screen share
        const previewVideo = document.createElement('video');
        previewVideo.srcObject = screenStream;
        previewVideo.autoplay = true;
        previewVideo.muted = true;
        previewVideo.style.position = 'fixed';
        previewVideo.style.bottom = '20px';
        previewVideo.style.left = '20px';
        previewVideo.style.width = '200px';
        previewVideo.style.height = '150px';
        previewVideo.style.border = '2px solid #10b981';
        previewVideo.style.borderRadius = '8px';
        previewVideo.style.zIndex = '1000';
        previewVideo.id = 'screen-share-preview';
        document.body.appendChild(previewVideo);
      }

      // Replace video track in peer connection
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(screenStream.getVideoTracks()[0]);
        } else {
          peerConnectionRef.current.addTrack(screenStream.getVideoTracks()[0], screenStream);
        }
      }

      setIsScreenSharing(true);
      
      // Handle when user stops sharing (browser stop button)
      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        // Remove preview in demo mode
        if (demoMode) {
          const preview = document.getElementById('screen-share-preview');
          if (preview) preview.remove();
        }
      };

    } catch (err) {
      console.error('Error starting screen share:', err);
      setError('Unable to start screen sharing. Please try again.');
    }
  };

  const stopScreenShare = () => {
    if (peerConnectionRef.current) {
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender && sender.track) {
        sender.track.stop();
        peerConnectionRef.current.removeTrack(sender);
      }
    }
    
    // Remove preview in demo mode
    if (demoMode) {
      const preview = document.getElementById('screen-share-preview');
      if (preview) preview.remove();
    }
    
    setIsScreenSharing(false);
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    if (!demoMode) {
      // Entering demo mode - simulate remote screen
      setTimeout(() => {
        simulateRemoteScreenShare();
      }, 1000);
    } else {
      // Exiting demo mode - clear simulated screen
      setSimulatedRemoteScreen(null);
      if (remoteScreenRef.current) {
        remoteScreenRef.current.srcObject = null;
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    cleanup();
    onEndCall();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const otherParticipant = meeting.participants.find(p => p !== currentUserEmail);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="text-white">
          <h2 className="text-xl font-bold">
            Screen Share Session with {demoMode ? 'Demo User' : otherParticipant}
            {demoMode && <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">DEMO MODE</span>}
          </h2>
          <p className="text-gray-300 text-sm">
            {(() => {
              const parsedDate = safeParseDate(meeting.scheduledDateTime);
              return parsedDate ? format(parsedDate, 'PPPp') : 'Date not available';
            })()} • {meeting.duration} min
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDemoMode}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              demoMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {demoMode ? 'Exit Demo' : 'Demo Mode'}
          </button>
          <div className="text-white text-lg font-mono">
            {formatDuration(callDuration)}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-white text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Screen Share Display */}
      <div className="flex-1 relative bg-gray-900">
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg">Connecting to {otherParticipant}...</p>
              <p className="text-gray-400 text-sm">Setting up screen sharing session</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
            <div className="text-center text-white bg-red-600/20 p-6 rounded-xl border border-red-600/30">
              <p className="text-lg mb-2">⚠️ Connection Error</p>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}

        {/* Remote Screen Display */}
        {isConnected && !error && (
          <div className="w-full h-full flex items-center justify-center">
            {(remoteStream || simulatedRemoteScreen) ? (
              <video
                ref={remoteScreenRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg mb-2">
                  {demoMode ? 'Demo Mode - Simulated Remote Screen' : `Waiting for ${otherParticipant} to share screen`}
                </p>
                <p className="text-gray-400 text-sm">
                  {demoMode ? 'This simulates what you would see from another user' : 'They can start sharing their screen anytime'}
                </p>
                {demoMode && (
                  <button
                    onClick={() => simulateRemoteScreenShare()}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Start Demo Screen Share
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Screen Share Status Indicator */}
        {isScreenSharing && (
          <div className="absolute top-4 left-4 bg-green-600/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">You are sharing your screen</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-6">
        <div className="flex justify-center items-center space-x-6">
          {/* Mute/Unmute */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 text-white"
            title="End Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
            </svg>
          </button>
        </div>

        {/* Session Info */}
        <div className="text-center mt-4 space-y-2">
          <div className="text-gray-400 text-sm">
            <p>Session ends in {Math.max(0, meeting.duration - Math.floor(callDuration / 60))} minutes</p>
          </div>
          <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
              Audio {isAudioEnabled ? 'On' : 'Off'}
            </span>
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isScreenSharing ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
              Screen {isScreenSharing ? 'Sharing' : 'Not Sharing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenShare;
