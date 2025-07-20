import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Plus, Trash2, Info } from 'lucide-react';
import { AppSettings } from '../types';
import { AboutApp } from './AboutApp';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onSave, 
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'about'>('settings');
  const [newStrategy, setNewStrategy] = useState('');
  const [newSetupTag, setNewSetupTag] = useState('');
  const [strategyError, setStrategyError] = useState<string>('');
  const [setupTagError, setSetupTagError] = useState<string>('');

  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    await onSave(updatedSettings);
  };

  const addCustomStrategy = async () => {
    const trimmedStrategy = newStrategy.trim();
    if (!trimmedStrategy) {
      setStrategyError('Please enter a strategy name');
      return;
    }

    // Check for duplicates (case-insensitive)
    if (settings.customStrategies.some(s => s.toLowerCase() === trimmedStrategy.toLowerCase())) {
      setStrategyError('This strategy already exists');
      return;
    }

    setStrategyError(''); // Clear error on success
    const updatedStrategies = [...settings.customStrategies, trimmedStrategy];
    await handleSettingChange('customStrategies', updatedStrategies);
    setNewStrategy('');
  };

  const deleteCustomStrategy = async (strategy: string) => {
    const updatedStrategies = settings.customStrategies.filter(s => s !== strategy);
    await handleSettingChange('customStrategies', updatedStrategies);
  };

  const addCustomSetupTag = async () => {
    const trimmedTag = newSetupTag.trim();
    if (!trimmedTag) {
      setSetupTagError('Please enter a setup tag name');
      return;
    }

    // Check for duplicates (case-insensitive)
    if (settings.customSetupTags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      setSetupTagError('This setup tag already exists');
      return;
    }

    setSetupTagError(''); // Clear error on success
    const updatedTags = [...settings.customSetupTags, trimmedTag];
    await handleSettingChange('customSetupTags', updatedTags);
    setNewSetupTag('');
  };

  const deleteCustomSetupTag = async (tag: string) => {
    const updatedTags = settings.customSetupTags.filter(t => t !== tag);
    await handleSettingChange('customSetupTags', updatedTags);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          
          {/* Header with Tabs */}
          <div className="border-b border-gray-700/50">
            <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
              <div className="flex items-center space-x-2">
                <SettingsIcon size={24} className="text-blue-400" />
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="px-6 pb-4">
              <div className="flex items-center space-x-1 bg-gray-700/30 rounded-lg p-1 max-w-lg mx-auto">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 flex-1 justify-center ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <SettingsIcon size={16} />
                  <span className="font-medium">Settings</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 flex-1 justify-center ${
                    activeTab === 'about'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <Info size={16} />
                  <span className="font-medium">About App</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeTab === 'settings' ? (
              <div className="p-6 space-y-8">
                {/* Account Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Starting Capital (USD)
                      </label>
                      <input
                        type="number"
                        value={settings.startingCapital}
                        onChange={(e) => handleSettingChange('startingCapital', parseFloat(e.target.value))}
                        className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="UTC" className="bg-gray-800 text-white">UTC</option>
                        <option value="America/New_York" className="bg-gray-800 text-white">Eastern Time</option>
                        <option value="America/Chicago" className="bg-gray-800 text-white">Central Time</option>
                        <option value="America/Denver" className="bg-gray-800 text-white">Mountain Time</option>
                        <option value="America/Los_Angeles" className="bg-gray-800 text-white">Pacific Time</option>
                        <option value="Europe/London" className="bg-gray-800 text-white">London</option>
                        <option value="Europe/Frankfurt" className="bg-gray-800 text-white">Frankfurt</option>
                        <option value="Asia/Tokyo" className="bg-gray-800 text-white">Tokyo</option>
                        <option value="Asia/Sydney" className="bg-gray-800 text-white">Sydney</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Strategy Management */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Strategy Management</h3>
                  <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 space-y-4">
                    {/* Add New Strategy */}
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newStrategy}
                        onChange={(e) => {
                          setNewStrategy(e.target.value);
                          setStrategyError(''); // Clear error when user types
                        }}
                        placeholder="Enter new strategy name..."
                        className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomStrategy())}
                      />
                      <button
                        type="button"
                        onClick={addCustomStrategy}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                    </div>
                    
                    {/* Strategy Error Message */}
                    {strategyError && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                        <span className="text-red-400 text-xs font-medium">{strategyError}</span>
                      </div>
                    )}

                    {/* Strategy List */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Available Strategies</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {settings.customStrategies.map((strategy) => (
                          <div key={strategy} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📊</span>
                              <span className="text-white">{strategy}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteCustomStrategy(strategy)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete strategy"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Setup Tags Management */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Setup Tags Management</h3>
                  <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 space-y-4">
                    {/* Add New Setup Tag */}
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newSetupTag}
                        onChange={(e) => {
                          setNewSetupTag(e.target.value);
                          setSetupTagError(''); // Clear error when user types
                        }}
                        placeholder="Enter new setup tag name..."
                        className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSetupTag())}
                      />
                      <button
                        type="button"
                        onClick={addCustomSetupTag}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                    </div>
                    
                    {/* Setup Tag Error Message */}
                    {setupTagError && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                        <span className="text-red-400 text-xs font-medium">{setupTagError}</span>
                      </div>
                    )}

                    {/* Setup Tags List */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Available Setup Tags</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {settings.customSetupTags.map((tag) => (
                          <div key={tag} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🏷️</span>
                              <span className="text-white">{tag}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteCustomSetupTag(tag)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete setup tag"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Export Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data Export Format
                      </label>
                      <select
                        value={settings.dataExportFormat}
                        onChange={(e) => handleSettingChange('dataExportFormat', e.target.value as 'CSV' | 'Excel')}
                        className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="CSV" className="bg-gray-800 text-white">CSV</option>
                        <option value="Excel" className="bg-gray-800 text-white">Excel</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Feature Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableAPlusTracking}
                        onChange={(e) => handleSettingChange('enableAPlusTracking', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-800/50 border-gray-600/50 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                      />
                      <div>
                        <span className="text-gray-300 font-medium">Enable A+ Setup Tracking</span>
                        <p className="text-gray-500 text-sm">Track and analyze your highest probability setups</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enablePsychologyTracking}
                        onChange={(e) => handleSettingChange('enablePsychologyTracking', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-800/50 border-gray-600/50 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                      />
                      <div>
                        <span className="text-gray-300 font-medium">Enable Psychology Tracking</span>
                        <p className="text-gray-500 text-sm">Track emotional states and trading psychology</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableScreenshotUpload}
                        onChange={(e) => handleSettingChange('enableScreenshotUpload', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-800/50 border-gray-600/50 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                      />
                      <div>
                        <span className="text-gray-300 font-medium">Enable Screenshot Upload</span>
                        <p className="text-gray-500 text-sm">Allow uploading trade screenshots and charts</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <AboutApp />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};