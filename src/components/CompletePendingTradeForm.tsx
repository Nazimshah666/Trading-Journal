import React, { useState, useCallback } from 'react';
import { CheckCircle, X, Calendar, Clock, DollarSign, Target, Info, Upload, Eye, Trash2 } from 'lucide-react';
import { PendingTrade, Trade, AppSettings } from '../types';
import { NumberInput } from './NumberInput';

interface CompletePendingTradeFormProps {
  pendingTrade: PendingTrade;
  onSubmit: (completedTrade: Partial<Trade>) => void;
  onCancel: () => void;
  settings: AppSettings;
}

interface FormData {
  exitDate: string;
  exitTime: string;
  exitPrice: string;
  modifiedSLTP: boolean;
  finalStopLoss: string;
  finalTakeProfit: string;
  notes: string;
  screenshotLink: string;
}

export const CompletePendingTradeForm: React.FC<CompletePendingTradeFormProps> = ({
  pendingTrade,
  onSubmit,
  onCancel,
  settings
}) => {
  const [formData, setFormData] = useState<FormData>({
    exitDate: new Date().toISOString().split('T')[0],
    exitTime: '',
    exitPrice: '',
    modifiedSLTP: false,
    finalStopLoss: pendingTrade.stopLoss?.toString() || '',
    finalTakeProfit: pendingTrade.takeProfit?.toString() || '',
    notes: pendingTrade.notes || '',
    screenshotLink: pendingTrade.screenshotLink || ''
  });

  const [uploadedScreenshot, setUploadedScreenshot] = useState<string>(pendingTrade.screenshotLink || '');
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(!!pendingTrade.screenshotLink);
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(''); // Clear any previous validation errors
    
    // Prevent double submission
    if (e.currentTarget.getAttribute('data-submitting') === 'true') {
      return;
    }
    e.currentTarget.setAttribute('data-submitting', 'true');
    
    const exitPrice = parseFloat(formData.exitPrice);
    
    if (isNaN(exitPrice) || exitPrice <= 0) {
      setValidationError('Please enter a valid exit price');
      e.currentTarget.removeAttribute('data-submitting');
      return;
    }

    // Determine final SL/TP values
    let finalStopLoss = pendingTrade.stopLoss;
    let finalTakeProfit = pendingTrade.takeProfit;
    
    if (formData.modifiedSLTP) {
      finalStopLoss = formData.finalStopLoss ? parseFloat(formData.finalStopLoss) : undefined;
      finalTakeProfit = formData.finalTakeProfit ? parseFloat(formData.finalTakeProfit) : undefined;
    }

    const completedTradeData: Partial<Trade> = {
      // Copy all pending trade data
      date: pendingTrade.date,
      entryTime: pendingTrade.entryTime,
      direction: pendingTrade.direction,
      pair: pendingTrade.pair,
      entryPrice: pendingTrade.entryPrice,
      lotSize: pendingTrade.lotSize,
      strategy: pendingTrade.strategy,
      setupTags: pendingTrade.setupTags,
      emotionRating: pendingTrade.emotionRating,
      isAPlusSetup: pendingTrade.isAPlusSetup,
      pipSize: pendingTrade.pipSize,
      pipValuePerStandardLot: pendingTrade.pipValuePerStandardLot,
      
      // Add completion data
      exitDate: formData.exitDate,
      exitTime: formData.exitTime,
      exitPrice,
      stopLoss: finalStopLoss,
      takeProfit: finalTakeProfit,
      notes: formData.notes,
      screenshotLink: uploadedScreenshot || formData.screenshotLink,
      
      // Multi-day trade detection
      isMultiDay: formData.exitDate !== pendingTrade.date
    };

    setValidationError(''); // Clear validation error on successful submission
    
    // Use setTimeout to ensure form state is properly handled
    setTimeout(() => {
      onSubmit(completedTradeData);
      e.currentTarget.removeAttribute('data-submitting');
    }, 0);
  };

  const handleNumberInput = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // Screenshot upload handler
  const handleScreenshotUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Image size must be less than 5MB');
        return;
      }
      
      setValidationError(''); // Clear any previous errors
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedScreenshot(dataUrl);
        setFormData(prev => ({ ...prev, screenshotLink: dataUrl }));
        setShowScreenshotPreview(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file
    event.target.value = '';
  }, []);

  // Clear uploaded screenshot
  const handleClearScreenshot = useCallback(() => {
    setUploadedScreenshot('');
    setFormData(prev => ({ ...prev, screenshotLink: '' }));
    setShowScreenshotPreview(false);
  }, []);

  // Handle URL input change
  const handleScreenshotUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, screenshotLink: url }));
    // Clear uploaded screenshot if URL is being used
    if (url && uploadedScreenshot) {
      setUploadedScreenshot('');
      setShowScreenshotPreview(false);
    }
  }, [uploadedScreenshot]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white">Complete Trade</h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                {pendingTrade.direction} {pendingTrade.pair} • Entry: {pendingTrade.entryPrice} • Pip Size: {pendingTrade.pipSize}
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-white p-1.5 sm:p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Exit Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Clock size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Exit Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Exit Date</span>
                </label>
                <input
                  type="date"
                  value={formData.exitDate}
                  onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  min={pendingTrade.date}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                  <Clock size={16} className="text-gray-400" />
                  <span>Exit Time</span>
                </label>
                <input
                  type="time"
                  value={formData.exitTime}
                  onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <NumberInput
                field="exitPrice"
                value={formData.exitPrice}
                onChange={handleNumberInput}
                placeholder="Exit price"
                step={0.00001}
                required
                label="Exit Price"
                icon={DollarSign}
                min={0}
              />
            </div>
          </div>

          {/* SL/TP Modification Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Target size={20} className="text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Risk Management Updates</h3>
            </div>

            {/* Modern Toggle for SL/TP modification */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    {/* Modern Toggle Switch */}
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.modifiedSLTP}
                        onChange={(e) => setFormData({ ...formData, modifiedSLTP: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-all duration-200 ${
                        formData.modifiedSLTP 
                          ? 'bg-blue-600 shadow-lg' 
                          : 'bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          formData.modifiedSLTP 
                            ? 'translate-x-5' 
                            : 'translate-x-0.5'
                        } translate-y-0.5`} />
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-white font-medium">Updated SL/TP during trade?</span>
                      <p className="text-gray-400 text-sm">If you trailed your SL or adjusted TP during the trade, turn this ON to log updated values.</p>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center space-x-1 text-gray-400">
                  <Info size={16} />
                  <span className="text-xs">For accurate R:R calculation</span>
                </div>
              </div>

              {formData.modifiedSLTP && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Target size={16} className="text-red-400" />
                      <span>Final Stop Loss</span>
                      {pendingTrade.originalStopLoss && (
                        <span className="text-xs text-gray-500">
                          (Original: {pendingTrade.originalStopLoss})
                        </span>
                      )}
                    </label>
                    <NumberInput
                      field="finalStopLoss"
                      value={formData.finalStopLoss}
                      onChange={handleNumberInput}
                      placeholder="Final SL price"
                      step={0.00001}
                      label=""
                      icon={() => null}
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                      <Target size={16} className="text-green-400" />
                      <span>Final Take Profit</span>
                      {pendingTrade.originalTakeProfit && (
                        <span className="text-xs text-gray-500">
                          (Original: {pendingTrade.originalTakeProfit})
                        </span>
                      )}
                    </label>
                    <NumberInput
                      field="finalTakeProfit"
                      value={formData.finalTakeProfit}
                      onChange={handleNumberInput}
                      placeholder="Final TP price"
                      step={0.00001}
                      label=""
                      icon={() => null}
                      min={0}
                    />
                  </div>
                </div>
              )}

              {!formData.modifiedSLTP && (pendingTrade.stopLoss || pendingTrade.takeProfit) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                  {pendingTrade.stopLoss && (
                    <div>
                      <span className="text-red-400">Stop Loss:</span> {pendingTrade.stopLoss}
                    </div>
                  )}
                  {pendingTrade.takeProfit && (
                    <div>
                      <span className="text-green-400">Take Profit:</span> {pendingTrade.takeProfit}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes & Screenshot Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Exit Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="Exit reasons, market conditions, lessons learned..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade View (Optional)</label>
                
                {/* Upload Button and URL Input */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Upload Button */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                      id="completion-screenshot-upload"
                    />
                    <label
                      htmlFor="completion-screenshot-upload"
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2  border border-gray-600/50 rounded-lg transition-all cursor-pointer bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500/50"
                    >
                      <Upload size={14} />
                      <span className="text-sm">
                        {uploadedScreenshot || pendingTrade.screenshot ? 'Replace Screenshot' : 'Upload Screenshot'}
                      </span>
                    </label>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <input
                      type="url"
                      value={uploadedScreenshot ? '' : formData.screenshotLink}
                      onChange={handleScreenshotUrlChange}
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Or paste URL..."
                      disabled={!!uploadedScreenshot}
                    />
                  </div>
                </div>
                
                {/* Screenshot Preview */}
                {(uploadedScreenshot || formData.screenshotLink) && (
                  <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-300">Preview</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowScreenshotPreview(!showScreenshotPreview)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title={showScreenshotPreview ? 'Minimize' : 'Expand'}
                        >
                          <Eye size={12} />
                        </button>
                        {uploadedScreenshot && (
                          <button
                            type="button"
                            onClick={handleClearScreenshot}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Remove screenshot"
                          >
                            <Trash2 size={12} />
                          </button>
                        
                        )}
                      </div>
                    </div>
                    
                    <div className={`overflow-hidden rounded-lg transition-all duration-300 ${
                      showScreenshotPreview ? 'max-h-64' : 'max-h-16'
                    }`}>
                      <img
                        src={uploadedScreenshot || formData.screenshotLink}
                        
                        alt="Trade Screenshot Preview"
                        className="w-full h-full object-contain bg-gray-900/50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {uploadedScreenshot ? 'Uploaded image' : 'External image'}
                      {!showScreenshotPreview && ' • Click eye to expand'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
            {/* Validation Error Message */}
            {validationError && (
              <div className="flex items-center space-x-2 mr-auto">
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                  <span className="text-red-400 text-xs font-medium">{validationError}</span>
                </div>
              </div>
            )}
            
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <CheckCircle size={16} />
              <span>Complete Trade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};