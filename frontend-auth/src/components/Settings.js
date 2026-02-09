import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      friendRequests: true,
      messages: true,
      meetings: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showSkills: true,
      allowDirectMessages: true
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC+05:30',
      autoAcceptMeetings: false
    },
    account: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      dataExport: false
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock data for now - replace with actual API call
      // const response = await api.get('/api/user/settings');
      // setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setSaveStatus('saving');
      
      // Mock API call - replace with actual endpoint
      // await api.put('/api/user/settings', settings);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        notifications: {
          email: true,
          push: true,
          friendRequests: true,
          messages: true,
          meetings: true
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showSkills: true,
          allowDirectMessages: true
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC+05:30',
          autoAcceptMeetings: false
        },
        account: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          dataExport: false
        }
      });
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-white font-medium">{label}</p>
        {description && <p className="text-white/60 text-sm">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-red-600' : 'bg-white/20'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const SelectField = ({ value, onChange, options, label, description }) => (
    <div className="py-3">
      <label className="block text-white font-medium mb-2">{label}</label>
      {description && <p className="text-white/60 text-sm mb-3">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm focus:border-red-500 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const SettingSection = ({ title, children }) => (
    <div className="glass-morphism rounded-2xl p-6 backdrop-blur-sm border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 glass-morphism rounded-2xl p-8 animate-fadeInUp">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-white/80">Manage your account preferences and privacy settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetSettings}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 border border-white/20"
              >
                Reset to Default
              </button>
              <button
                onClick={saveSettings}
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          {saveStatus && (
            <div className={`mt-4 p-3 rounded-lg ${
              saveStatus === 'saved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              saveStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {saveStatus === 'saved' && '✅ Settings saved successfully!'}
              {saveStatus === 'error' && '❌ Failed to save settings. Please try again.'}
              {saveStatus === 'saving' && '⏳ Saving settings...'}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Notifications */}
          <SettingSection title="Notifications">
            <ToggleSwitch
              enabled={settings.notifications.email}
              onChange={(value) => handleSettingChange('notifications', 'email', value)}
              label="Email Notifications"
              description="Receive notifications via email"
            />
            <ToggleSwitch
              enabled={settings.notifications.push}
              onChange={(value) => handleSettingChange('notifications', 'push', value)}
              label="Push Notifications"
              description="Receive browser push notifications"
            />
            <ToggleSwitch
              enabled={settings.notifications.friendRequests}
              onChange={(value) => handleSettingChange('notifications', 'friendRequests', value)}
              label="Friend Requests"
              description="Get notified when someone sends you a friend request"
            />
            <ToggleSwitch
              enabled={settings.notifications.messages}
              onChange={(value) => handleSettingChange('notifications', 'messages', value)}
              label="Messages"
              description="Get notified when you receive new messages"
            />
            <ToggleSwitch
              enabled={settings.notifications.meetings}
              onChange={(value) => handleSettingChange('notifications', 'meetings', value)}
              label="Meeting Reminders"
              description="Get reminded about upcoming meetings"
            />
          </SettingSection>

          {/* Privacy */}
          <SettingSection title="Privacy & Visibility">
            <SelectField
              value={settings.privacy.profileVisibility}
              onChange={(value) => handleSettingChange('privacy', 'profileVisibility', value)}
              label="Profile Visibility"
              description="Control who can see your profile"
              options={[
                { value: 'public', label: 'Public - Anyone can see' },
                { value: 'friends', label: 'Friends Only' },
                { value: 'private', label: 'Private - Hidden from search' }
              ]}
            />
            <ToggleSwitch
              enabled={settings.privacy.showEmail}
              onChange={(value) => handleSettingChange('privacy', 'showEmail', value)}
              label="Show Email Address"
              description="Display your email on your public profile"
            />
            <ToggleSwitch
              enabled={settings.privacy.showSkills}
              onChange={(value) => handleSettingChange('privacy', 'showSkills', value)}
              label="Show Skills"
              description="Display your skills and learning goals publicly"
            />
            <ToggleSwitch
              enabled={settings.privacy.allowDirectMessages}
              onChange={(value) => handleSettingChange('privacy', 'allowDirectMessages', value)}
              label="Allow Direct Messages"
              description="Let anyone send you messages"
            />
          </SettingSection>

          {/* Preferences */}
          <SettingSection title="Preferences">
            <SelectField
              value={settings.preferences.theme}
              onChange={(value) => handleSettingChange('preferences', 'theme', value)}
              label="Theme"
              description="Choose your preferred color scheme"
              options={[
                { value: 'dark', label: 'Dark Theme' },
                { value: 'light', label: 'Light Theme' },
                { value: 'auto', label: 'Auto (System)' }
              ]}
            />
            <SelectField
              value={settings.preferences.language}
              onChange={(value) => handleSettingChange('preferences', 'language', value)}
              label="Language"
              description="Select your preferred language"
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' }
              ]}
            />
            <SelectField
              value={settings.preferences.timezone}
              onChange={(value) => handleSettingChange('preferences', 'timezone', value)}
              label="Timezone"
              description="Your local timezone for scheduling"
              options={[
                { value: 'UTC+05:30', label: 'India Standard Time (UTC+05:30)' },
                { value: 'UTC+00:00', label: 'UTC (UTC+00:00)' },
                { value: 'UTC-05:00', label: 'Eastern Time (UTC-05:00)' },
                { value: 'UTC-08:00', label: 'Pacific Time (UTC-08:00)' }
              ]}
            />
            <ToggleSwitch
              enabled={settings.preferences.autoAcceptMeetings}
              onChange={(value) => handleSettingChange('preferences', 'autoAcceptMeetings', value)}
              label="Auto-accept Meeting Invites"
              description="Automatically accept meeting invitations from friends"
            />
          </SettingSection>

          {/* Account Security */}
          <SettingSection title="Account & Security">
            <ToggleSwitch
              enabled={settings.account.twoFactorAuth}
              onChange={(value) => handleSettingChange('account', 'twoFactorAuth', value)}
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
            />
            <SelectField
              value={settings.account.sessionTimeout}
              onChange={(value) => handleSettingChange('account', 'sessionTimeout', parseInt(value))}
              label="Session Timeout"
              description="Automatically log out after inactivity"
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '240', label: '4 hours' },
                { value: '0', label: 'Never' }
              ]}
            />
            <div className="py-3">
              <button
                onClick={() => alert('Data export feature coming soon!')}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-6 py-2 rounded-lg font-medium transition-all duration-300 border border-blue-600/30"
              >
                Export My Data
              </button>
              <p className="text-white/60 text-sm mt-2">Download all your account data</p>
            </div>
            <div className="py-3">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion feature coming soon!');
                  }
                }}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-all duration-300 border border-red-600/30"
              >
                Delete Account
              </button>
              <p className="text-white/60 text-sm mt-2">Permanently delete your account and all data</p>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
};

export default Settings;
