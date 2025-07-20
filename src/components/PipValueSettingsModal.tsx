import React, { useState, useEffect } from 'react';
import { X, Settings, Hash, Save, DollarSign } from 'lucide-react';
import { PairSettings } from '../types';
import { getPipSize, getPipValuePerStandardLot } from '../constants';
import { NumberInput } from './NumberInput';

interface PipValueSettingsModalProps {
  pair: string;
  currentSettings: PairSettings;
  onSave: (settings: PairSettings) => void;
  onClose: () => void;
}

export const PipValueSettingsModal: React.FC<PipValueSettingsModalProps> = ({
  pair,
  currentSettings,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    customPipSize: currentSettings.customPipSize?.toString() || '',
    customPipValuePerStandardLot: currentSettings.customPipValuePerStandardLot?.toString() || ''
  });

  const [isVisible, setIsVisible] = useState(false);

  // Smooth animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const standardPipSize = getPipSize(pair);
  const standardPipValuePerStandardLot = getPipValuePerStandardLot(pair);

  const handleNumberInput = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const customPipSize = formData.customPipSize ? parseFloat(formData.customPipSize) : undefined;
    const customPipValuePerStandardLot = formData.customPipValuePerStandardLot ? parseFloat(formData.customPipValuePerStandardLot) : undefined;
    
    if (customPipSize !== undefined && (isNaN(customPipSize) || customPipSize <= 0)) {
      alert('Please enter a valid pip size');
      return;
    }

    if (customPipValuePerStandardLot !== undefined && (isNaN(customPipValuePerStandardLot) || customPipValuePerStandardLot <= 0)) {
      alert('Please enter a valid pip value per standard lot');
      return;
    }

    const settings: PairSettings = {
      customPipSize,
      customPipValuePerStandardLot
    };

    onSave(settings);
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for animation to complete
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleBackdropClick}>
      <div 
        className={`bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md lg:max-w-lg max-h-[80vh] overflow-hidden flex flex-col transition-all duration-200 transform ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-700/50 bg-gray-800/20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg shadow-sm">
              <Settings size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Pip Settings</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{pair}</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-white p-1.5 sm:p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 flex-shrink-0"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">
            {/* Pip Size Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center">
                <Hash size={14} className="mr-2 text-blue-400" />
                Pip Size Configuration
              </h3>
              
              {/* Standard Pip Size Display */}
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Standard</span>
                  <span className="text-xs text-gray-500">Industry Default</span>
                </div>
                <p className="text-white font-mono text-lg">{standardPipSize}</p>
                <p className="text-xs text-gray-500 mt-1">Standard pip size for {pair}</p>
              </div>

              {/* Custom Pip Size Override */}
              <div className="space-y-2">
                <NumberInput
                  field="customPipSize"
                  value={formData.customPipSize}
                  onChange={handleNumberInput}
                  placeholder={`Default: ${standardPipSize}`}
                  step={0.00001}
                  label="Custom Override"
                  icon={Hash}
                  min={0}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to use standard pip size
                </p>
              </div>
            </div>

            {/* Pip Value Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center">
                <DollarSign size={14} className="mr-2 text-green-400" />
                Pip Value Configuration
              </h3>
              
              {/* Standard Pip Value Display */}
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Standard (per lot)</span>
                  <span className="text-xs text-gray-500">Industry Default</span>
                </div>
                <p className="text-white font-mono text-lg">${standardPipValuePerStandardLot}</p>
                <p className="text-xs text-gray-500 mt-1">Standard pip value for {pair}</p>
              </div>

              {/* Custom Pip Value Override */}
              <div className="space-y-2">
                <NumberInput
                  field="customPipValuePerStandardLot"
                  value={formData.customPipValuePerStandardLot}
                  onChange={handleNumberInput}
                  placeholder={`Default: ${standardPipValuePerStandardLot}`}
                  step={0.01}
                  label="Custom Override"
                  icon={DollarSign}
                  min={0}
                  prefix="$"
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    e.g., 10 for EURUSD, 1 for XAUUSD, 1 for BTCUSD
                  </p>
                  <p className="text-xs text-gray-500">
                    Leave empty to use standard pip value
                  </p>
                </div>
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <h4 className="text-blue-400 font-medium mb-2 text-sm flex items-center">
                <Settings size={12} className="mr-1" />
                How This Works
              </h4>
              <ul className="text-xs text-gray-300 space-y-1 leading-relaxed">
                <li>• Custom values override standard values for this pair</li>
                <li>• Used for calculating risk, reward, and P&L</li>
                <li>• Pip value determines dollar amount per pip movement</li>
                <li>• Changes apply to new trades only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-3 p-4 sm:p-5 border-t border-gray-700/50 bg-gray-800/20 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};