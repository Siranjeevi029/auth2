import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './axios';

const Email = ({email}) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds = 1 minute
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false); // Boolean flag to prevent multiple submissions
  const navigate = useNavigate();

  // Fetch timer from backend and calculate based on DB creation time + 1 minute
  const fetchTimer = useCallback(async () => {
    try {
      const response = await api.get(`/otp/timer/${encodeURIComponent(email)}`);
      const data = response.data;
      
      if (data.error || data.isExpired) {
        setIsExpired(true);
        setErrorMessage(data.error || 'OTP has expired');
        setTimeLeft(0);
        return;
      }
      
      // Get times from backend response
      const createdAt = data.createdAt;
      const currentTime = Date.now();
      
      // Calculate expiration time (creation time + 60 seconds)
      const expiresAt = createdAt + 60000;
      
      // Calculate time left in seconds
      const timeLeftMs = Math.max(0, expiresAt - currentTime);
      const timeLeftSeconds = Math.floor(timeLeftMs / 1000);
      
      setTimeLeft(timeLeftSeconds);
      
      // Reset expired state if we have time left
      if (timeLeftSeconds > 0) {
        setIsExpired(false);
        setErrorMessage('');
      } else {
        setIsExpired(true);
        setErrorMessage('OTP has expired - Data deleted from server');
      }
    } catch (err) {
      console.error('Failed to fetch timer:', err);
      setIsExpired(true);
      setErrorMessage('Failed to verify OTP status');
      setTimeLeft(0);
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Reset component state when email changes (new OTP generated)
  useEffect(() => {
    setLoading(true);
    setIsExpired(false);
    setErrorMessage('');
    setTimeLeft(60);
    setIsVerifying(false); // Reset verification flag when new OTP is generated
  }, [email, fetchTimer]);

  // Initial fetch and periodic sync with backend
  useEffect(() => {
    if (email) {
      fetchTimer();
      
      // Sync with backend every 5 seconds for accuracy
      const syncInterval = setInterval(fetchTimer, 5000);
      
      return () => clearInterval(syncInterval);
    }
  }, [email]);

  // Local countdown timer for smooth second-by-second display
  useEffect(() => {
    if (!loading && timeLeft > 0 && !isExpired) {
      const countdownTimer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsExpired(true);
            // Redirect to register page after 3 seconds when timer expires
            setTimeout(() => {
              navigate('/register');
            }, 3000);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(countdownTimer);
    }
  }, [timeLeft, loading, isExpired, navigate]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (isExpired) {
      setErrorMessage('OTP has expired. Please request a new one.');
      return;
    }
    
    // Prevent multiple submissions
    if (isVerifying) {
      return;
    }
    
    setIsVerifying(true);
    setErrorMessage(''); // Clear any previous error messages
    
    try {
      await api.post('/otp/verify', { email, otp: code });
      navigate('/login');
    } catch (err) {
      setErrorMessage('Invalid verification code');
      console.error(err);
      setIsVerifying(false); // Reset flag on error to allow retry
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism rounded-2xl p-8 text-center animate-fadeInUp">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking OTP status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center animate-fadeInUp">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">✉</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Verify Your Email</h2>
          <p className="text-gray-300 text-lg">Enter the 6-digit code sent to {email}</p>
          
          {/* Timer Display */}
          <div className="mt-4 p-3 bg-black/30 rounded-xl border border-red-600/30">
            <div className="text-center">
              <span className={`font-mono text-2xl font-bold ${
                timeLeft <= 10 ? 'text-red-400 animate-pulse' : 
                timeLeft <= 30 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                OTP will expire in {formatTime(timeLeft)}. Please enter the code before it expires.
              </span>
            </div>
            {isExpired && timeLeft <= 0 && (
              <div className="text-center mt-2 space-y-2">
                <p className="text-red-400 text-sm">
                  ⚠️ Code has expired
                </p>
                <p className="text-yellow-400 text-xs animate-pulse">
                  Redirecting back to registration...
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-morphism rounded-2xl p-8 space-y-6 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-white mb-2">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-4 py-3 border border-red-600/30 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 bg-black/50 backdrop-blur-sm text-white placeholder-gray-400 text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength="6"
              />
            </div>
            
            <button
              type="submit"
              disabled={isExpired || isVerifying}
              className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 ${
                isExpired || isVerifying
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'btn-gradient text-white hover:scale-105'
              }`}
            >
              {isExpired ? 'OTP Expired' : isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          
          {errorMessage && (
            <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-xl text-sm text-center">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Email;
