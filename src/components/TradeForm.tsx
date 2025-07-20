import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Star, Calendar, DollarSign, Clock, TrendingUp, Target, Hash, FileText, Camera, Brain, Settings, Calculator, Zap, Info, ChevronDown, ChevronUp, Upload, Eye, Trash2 } from 'lucide-react';
import { Trade, AppSettings, PairSettings } from '../types';
import { getPipSize, getPipValuePerStandardLot } from '../constants';
import { PairSelector } from './PairSelector';
import { NumberInput } from './NumberInput';
import { PipValueSettingsModal } from './PipValueSettingsModal';
import { formatCleanNumberDisplay } from '../utils/formatting';
import { useAutoFocus } from '../hooks/useAutoFocus';

interface TradeFormProps {
  onSubmit: (trade: Partial<Trade>) => void;
  onCancel: () => void;
  onShowPendingForm: () => void;
  settings: AppSettings;
  onUpdatePairSettings: (pair: string, pairSettings: PairSettings) => void;
  isReadOnlyMode?: boolean;
}

interface FormData {
  date: string;
  exitDate: string;
  entryTime: string;
  exitTime: string;
  direction: 'Buy' | 'Sell';
  pair: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  exitPrice: string;
  slDollarRisk: string;
  lotSize: string;
  pipValuePerStandardLot: string;
  strategy: string;
  setupTags: string[];
  notes: string;
  screenshotLink: string;
  emotionRating: number;
  isAPlusSetup: boolean;
  isMultiDay: boolean;
  pipSize: string;
}

// Memoized components for performance
const FormSection = React.memo(({ title, icon: Icon, children, tooltip }: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
  tooltip?: string;
}) => (
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <Icon size={16} className="text-blue-400" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {tooltip && (
        <div className="group relative">
          <Info size={12} className="text-gray-500 hover:text-gray-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {tooltip}
          </div>
        </div>
      )}
    </div>
    {children}
  </div>
));

const CollapsibleFormSection = React.memo(({ title, icon: Icon, children, tooltip, defaultOpen = false }: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
  tooltip?: string;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-200 border border-gray-700/30"
      >
        <div className="flex items-center space-x-2">
          <Icon size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {tooltip && (
            <div className="group relative">
              <Info size={12} className="text-gray-500 hover:text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </button>
      {isOpen && (
        <div className="animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
});

const TagSelector = React.memo(({ tags, selectedTags, onToggle }: {
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {tags.map(tag => (
      <button
        key={tag}
        type="button"
        onClick={() => onToggle(tag)}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
          selectedTags.includes(tag)
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
        }`}
      >
        {tag}
      </button>
    ))}
  </div>
));

export const TradeForm: React.FC<TradeFormProps> = ({ 
  onSubmit, 
  onCancel, 
  onShowPendingForm, 
  settings,
  onUpdatePairSettings,
  isReadOnlyMode = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    exitDate: '',
    entryTime: '',
    exitTime: '',
    direction: 'Buy',
    pair: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    exitPrice: '',
    slDollarRisk: '',
    lotSize: '',
    pipValuePerStandardLot: '',
    strategy: '',
    setupTags: [],
    notes: '',
    screenshotLink: '',
    emotionRating: 5,
    isAPlusSetup: false,
    isMultiDay: false,
    pipSize: '1'
  });

  const [autoCalculateMode, setAutoCalculateMode] = useState(true);
  const [showPipSettingsModal, setShowPipSettingsModal] = useState(false);
  const [useTakeProfit, setUseTakeProfit] = useState(false);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string>('');
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Auto-focus first input when form opens
  const firstInputRef = useAutoFocus(true);

  // Get current pair settings
  const currentPairSettings = formData.pair ? settings.pairSettings?.[formData.pair] : undefined;

  // Get strategies and setup tags from settings
  const allStrategies = useMemo(() => settings.customStrategies || [], [settings.customStrategies]);
  const allSetupTags = useMemo(() => settings.customSetupTags || [], [settings.customSetupTags]);

  // Auto-assign pip size and pip value when pair changes
  useEffect(() => {
    if (formData.pair) {
      const defaultPipSize = getPipSize(formData.pair, currentPairSettings?.customPipSize);
      const defaultPipValuePerStandardLot = getPipValuePerStandardLot(formData.pair, currentPairSettings?.customPipValuePerStandardLot);
      setFormData(prev => ({ 
        ...prev, 
        pipSize: defaultPipSize.toString(),
        pipValuePerStandardLot: defaultPipValuePerStandardLot.toString()
      }));
    }
  }, [formData.pair, currentPairSettings?.customPipSize, currentPairSettings?.customPipValuePerStandardLot]);

  // Clear TP when toggle is disabled
  useEffect(() => {
    if (!useTakeProfit) {
      setFormData(prev => ({ ...prev, takeProfit: '' }));
    }
  }, [useTakeProfit]);

  // Auto-calculation logic with PRECISE calculations - NO ROUNDING
  useEffect(() => {
    if (!formData.pair || !formData.entryPrice || !autoCalculateMode) return;

    const entryPrice = parseFloat(formData.entryPrice);
    const slPrice = parseFloat(formData.stopLoss);
    const slDollarRisk = parseFloat(formData.slDollarRisk);
    const pipSize = parseFloat(formData.pipSize);
    const standardPipValuePerLot = getPipValuePerStandardLot(formData.pair, currentPairSettings?.customPipValuePerStandardLot);

    if (isNaN(entryPrice) || isNaN(pipSize)) return;

    // Clear lot size when risk is removed
    if (!slDollarRisk || slDollarRisk <= 0) {
      setFormData(prev => ({
        ...prev,
        lotSize: '',
        pipValuePerStandardLot: standardPipValuePerLot.toString()
      }));
      return;
    }

    if (!isNaN(slDollarRisk) && slDollarRisk > 0 && !isNaN(slPrice) && slPrice > 0) {
      // PRECISE CALCULATION - NO ROUNDING
      // Formula: SL Pips = |Entry - SL| / PipSize
      const slPips = Math.abs(entryPrice - slPrice) / pipSize;
      
      if (slPips > 0) {
        // Formula: Lot Size = SL Dollar / (SL Pips × Pip Value per Standard Lot)
        const calculatedLotSize = slDollarRisk / (slPips * standardPipValuePerLot);
        
        // Store the EXACT calculated lot size with full precision
        setFormData(prev => ({
          ...prev,
          lotSize: calculatedLotSize.toString(),
          pipValuePerStandardLot: standardPipValuePerLot.toString()
        }));
      }
    }
  }, [
    formData.pair,
    formData.entryPrice,
    formData.stopLoss,
    formData.slDollarRisk,
    formData.pipSize,
    autoCalculateMode,
    currentPairSettings?.customPipValuePerStandardLot
  ]);

  // Calculate manual risk for display in Manual mode
  const manualRisk = useMemo((): string => {
    if (autoCalculateMode || !formData.pair || !formData.entryPrice || !formData.stopLoss || !formData.lotSize) {
      return '';
    }

    const entryPrice = parseFloat(formData.entryPrice);
    const slPrice = parseFloat(formData.stopLoss);
    const lotSize = parseFloat(formData.lotSize);
    const pipSize = parseFloat(formData.pipSize);
    const pipValuePerLot = parseFloat(formData.pipValuePerStandardLot);

    if (isNaN(entryPrice) || isNaN(slPrice) || isNaN(lotSize) || isNaN(pipSize) || isNaN(pipValuePerLot)) {
      return '';
    }

    // Don't calculate if Entry = SL (zero pip movement)
    if (entryPrice === slPrice) {
      return '';
    }

    // Risk calculation: (|Entry Price – SL Price| ÷ Pip Size) × Lot Size × Pip Value
    const slPips = Math.abs(entryPrice - slPrice) / pipSize;
    const risk = slPips * lotSize * pipValuePerLot;

    return risk.toFixed(2);
  }, [autoCalculateMode, formData.pair, formData.entryPrice, formData.stopLoss, formData.lotSize, formData.pipSize, formData.pipValuePerStandardLot]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(''); // Clear any previous validation errors
    
    // Prevent double submission
    if (e.currentTarget.getAttribute('data-submitting') === 'true') {
      return;
    }
    e.currentTarget.setAttribute('data-submitting', 'true');
    
    if (!formData.pair) {
      setValidationError('Please select a trading pair');
      e.currentTarget.removeAttribute('data-submitting');
      return;
    }
    
    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const lotSize = parseFloat(formData.lotSize);
    const pipSize = parseFloat(formData.pipSize);
    const pipValuePerStandardLot = parseFloat(formData.pipValuePerStandardLot);
    
    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(lotSize) || isNaN(pipSize) || isNaN(pipValuePerStandardLot)) {
      setValidationError('Please complete all required fields with valid numbers');
      e.currentTarget.removeAttribute('data-submitting');
      return;
    }
    
    if (entryPrice <= 0 || exitPrice <= 0 || lotSize <= 0 || pipSize <= 0 || pipValuePerStandardLot <= 0) {
      setValidationError('All numeric values must be greater than zero');
      e.currentTarget.removeAttribute('data-submitting');
      return;
    }
    
    if (formData.isMultiDay && !formData.exitDate) {
      setValidationError('Please provide an exit date for multi-day trades');
      e.currentTarget.removeAttribute('data-submitting');
      return;
    }
    
    const tradeData: Partial<Trade> = {
      date: formData.date,
      exitDate: formData.isMultiDay ? formData.exitDate : undefined,
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      direction: formData.direction,
      pair: formData.pair,
      entryPrice,
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
      takeProfit: useTakeProfit && formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
      exitPrice,
      lotSize, // Use the EXACT lot size with full precision
      strategy: formData.strategy,
      setupTags: formData.setupTags,
      notes: formData.notes,
      screenshotLink: formData.screenshotLink,
      emotionRating: formData.emotionRating,
      isAPlusSetup: formData.isAPlusSetup,
      isMultiDay: formData.isMultiDay,
      pipSize,
      pipValuePerStandardLot
    };
    
    setValidationError(''); // Clear validation error on successful submission
    
    // Use setTimeout to ensure form state is properly handled
    setTimeout(() => {
      onSubmit(tradeData);
      e.currentTarget.removeAttribute('data-submitting');
    }, 0);
  }, [formData, onSubmit, useTakeProfit]);

  const handleTagToggle = useCallback((tag: string) => {
    setFormData(prev => ({
      ...prev,
      setupTags: prev.setupTags.includes(tag)
        ? prev.setupTags.filter(t => t !== tag)
        : [...prev.setupTags, tag]
    }));
  }, []);

  const handleNumberInput = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMultiDayToggle = useCallback(() => {
    setFormData(prev => ({ 
      ...prev, 
      isMultiDay: !prev.isMultiDay,
      exitDate: !prev.isMultiDay ? (prev.exitDate || prev.date) : ''
    }));
  }, []);

  const handlePipSettingsSave = useCallback((pairSettings: PairSettings) => {
    onUpdatePairSettings(formData.pair, pairSettings);
  }, [formData.pair, onUpdatePairSettings]);

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

  // Calculate effective SL risk for display
  const getEffectiveSLRisk = useMemo((): string => {
    if (!autoCalculateMode || !formData.pair || !formData.entryPrice || !formData.stopLoss || !formData.lotSize) return '';
    
    const entryPrice = parseFloat(formData.entryPrice);
    const slPrice = parseFloat(formData.stopLoss);
    const lotSize = parseFloat(formData.lotSize);
    const pipSize = parseFloat(formData.pipSize);
    const pipValuePerLot = parseFloat(formData.pipValuePerStandardLot);
    
    if (isNaN(entryPrice) || isNaN(slPrice) || isNaN(lotSize) || isNaN(pipSize) || isNaN(pipValuePerLot)) return '';
    
    const slPips = Math.abs(entryPrice - slPrice) / pipSize;
    const effectiveRisk = slPips * pipValuePerLot * lotSize;
    
    return effectiveRisk.toFixed(2);
  }, [autoCalculateMode, formData.pair, formData.entryPrice, formData.stopLoss, formData.lotSize, formData.pipSize, formData.pipValuePerStandardLot]);

  const getEffectivePipValue = useMemo((): string => {
    if (!autoCalculateMode) return '';
    const lotSize = parseFloat(formData.lotSize);
    const pipValuePerLot = parseFloat(formData.pipValuePerStandardLot);
    if (isNaN(lotSize) || isNaN(pipValuePerLot)) return '';
    return (lotSize * pipValuePerLot).toFixed(2);
  }, [autoCalculateMode, formData.lotSize, formData.pipValuePerStandardLot]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700/30 bg-gray-800/20">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Plus size={18} className="text-blue-400" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Add Trade</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowPendingForm}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 bg-orange-600/20 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-600/30 transition-all text-xs"
              title="Add pending trade instead"
            >
              <Clock size={12} />
              <span className="hidden sm:inline">Pending</span>
            </button>
            
            <button 
              onClick={onCancel} 
              className="text-gray-400 hover:text-white p-1 sm:p-1.5 rounded-lg hover:bg-gray-700/50 transition-all"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            
            {/* Trading Pair */}
            <FormSection title="Trading Pair" icon={Hash}>
              <div className="flex items-center space-x-2">
                <PairSelector
                  value={formData.pair}
                  onChange={(pair) => setFormData(prev => ({ ...prev, pair }))}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPipSettingsModal(true)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-400 hover:bg-gray-700/30 transition-all"
                  title="Configure pip settings"
                >
                  <Settings size={14} />
                </button>
              </div>
            </FormSection>

            {/* Trade Type & Strategy */}
            <FormSection title="Type & Strategy" icon={TrendingUp}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Direction</label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value as 'Buy' | 'Sell' }))}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="Buy">•Buy</option>
                    <option value="Sell">•Sell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Strategy</label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="" className="bg-gray-800 text-white">Select strategy...</option>
                    {allStrategies.map(strategy => (
                      <option key={strategy} value={strategy} className="bg-gray-800 text-white">{strategy}</option>
                    ))}
                  </select>
                </div>
              </div>
            </FormSection>

            {/* Timing */}
            <FormSection title="Timing" icon={Clock}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Entry Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                    ref={firstInputRef}
                    disabled={isReadOnlyMode}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Entry Time</label>
                  <input
                    type="time"
                    value={formData.entryTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryTime: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Exit Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.exitTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitTime: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                      disabled={isReadOnlyMode}
                    />
                    <button
                      type="button"
                      onClick={handleMultiDayToggle}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-all ${
                        formData.isMultiDay 
                          ? 'text-blue-400 bg-blue-500/20' 
                          : 'text-gray-400 hover:text-blue-400'
                      }`}
                      title="Multi-day trade"
                      disabled={isReadOnlyMode}
                    >
                      <Calendar size={12} />
                    </button>
                  </div>
                </div>
                {formData.isMultiDay && (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Exit Date</label>
                    <input
                      type="date"
                      value={formData.exitDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      min={formData.date}
                      required
                      disabled={isReadOnlyMode}
                    />
                  </div>
                )}
              </div>
            </FormSection>

            {/* Price Levels */}
            <FormSection title="Price Levels" icon={DollarSign}>
              <div className="space-y-3">
                {/* Entry and Exit Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    field="entryPrice"
                    value={formData.entryPrice}
                    onChange={handleNumberInput}
                    placeholder="Entry"
                    step={0.00001}
                    required
                    label="Entry"
                    icon={() => null}
                    min={0}
                  />
                  <NumberInput
                    field="exitPrice"
                    value={formData.exitPrice}
                    onChange={handleNumberInput}
                    placeholder="Exit"
                    step={0.00001}
                    required
                    label="Exit"
                    icon={() => null}
                    min={0}
                  />
                </div>

                {/* Stop Loss */}
                <div className="grid grid-cols-1 gap-3">
                  <NumberInput
                    field="stopLoss"
                    value={formData.stopLoss}
                    onChange={handleNumberInput}
                    placeholder="SL (optional)"
                    step={0.00001}
                    label="Stop Loss"
                    icon={() => null}
                    min={0}
                  />
                </div>

                {/* Take Profit with Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">Use Take Profit</span>
                    <button
                      type="button"
                      onClick={() => setUseTakeProfit(!useTakeProfit)}
                      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                        useTakeProfit ? 'bg-blue-600 shadow-lg' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        useTakeProfit ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  {useTakeProfit && (
                    <div className="animate-fade-in-up">
                      <NumberInput
                        field="takeProfit"
                        value={formData.takeProfit}
                        onChange={handleNumberInput}
                        placeholder="TP (optional)"
                        step={0.00001}
                        label="Take Profit"
                        icon={() => null}
                        min={0}
                      />
                    </div>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Position Sizing */}
            <FormSection 
              title="Position Sizing" 
              icon={Calculator}
              tooltip={autoCalculateMode 
                ? "Auto-mode: Enter Risk $ → calculates Lot Size based on SL distance"
                : "Manual mode: Enter Lot Size and Pip Value manually"
              }
            >
              <div className="space-y-3">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Mode</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Manual</span>
                    <button
                      type="button"
                      onClick={() => setAutoCalculateMode(!autoCalculateMode)}
                      className={`relative w-10 h-5 rounded-full transition-all ${
                        autoCalculateMode ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoCalculateMode ? 'translate-x-5' : 'translate-x-0.5'
                      }`}>
                        {autoCalculateMode && (
                          <Zap size={8} className="text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </button>
                    <span className="text-xs text-gray-400">Auto</span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {autoCalculateMode ? (
                    <>
                      <NumberInput
                        field="slDollarRisk"
                        value={formData.slDollarRisk}
                        onChange={handleNumberInput}
                        placeholder="100.00"
                        step={0.01}
                        label="Risk $"
                        icon={() => null}
                        min={0}
                        prefix="$"
                        forcePositive
                      />
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Lot Size (Auto)
                        </label>
                        <input
                          type="text"
                          value={formData.lotSize ? formatCleanNumberDisplay(formData.lotSize) : ''}
                          className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                          placeholder="Calculated"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Per Pip Value ($)</label>
                        <input
                          type="text"
                          value={getEffectivePipValue ? `$${getEffectivePipValue}` : ''}
                          className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                          placeholder="$0.00"
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <NumberInput
                          field="lotSize"
                          value={formData.lotSize}
                          onChange={handleNumberInput}
                          placeholder="0.01"
                          step={0.01}
                          label="Lot Size"
                          icon={() => null}
                          min={0}
                        />
                        {/* Manual Risk Display */}
                        {manualRisk && (
                          <div className="mt-2 text-xs text-gray-400">
                            Risk: ${manualRisk}
                          </div>
                        )}
                      </div>
                      <NumberInput
                        field="pipValuePerStandardLot"
                        value={formData.pipValuePerStandardLot}
                        onChange={handleNumberInput}
                        placeholder="10.00"
                        step={0.01}
                        label="Pip Value/Lot"
                        icon={() => null}
                        min={0}
                        prefix="$"
                      />
                    </>
                  )}
                </div>

                {/* Effective SL Risk Display */}
                {autoCalculateMode && getEffectiveSLRisk && (
                  <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Effective SL Risk:</span>
                      <span className="text-white font-medium">${getEffectiveSLRisk}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Actual risk based on calculated lot size
                    </p>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Psychology */}
            <FormSection title="Psychology" icon={Brain}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Emotion Rating: {formData.emotionRating}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.emotionRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, emotionRating: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* A+ Setup Toggle */}
                <div className="flex items-center justify-center">
                  <label className={`aplus-toggle ${formData.isAPlusSetup ? 'active' : ''}`}>
                    <div className={`aplus-toggle-switch ${formData.isAPlusSetup ? 'active' : ''}`}>
                      <div className="aplus-toggle-knob">
                        <Star className="aplus-toggle-icon text-yellow-600" size={10} />
                      </div>
                    </div>
                    <span className="aplus-toggle-label text-sm">A+ Setup</span>
                    <input
                      type="checkbox"
                      checked={formData.isAPlusSetup}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAPlusSetup: e.target.checked }))}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </FormSection>

            {/* Setup Tags - Collapsible */}
            <CollapsibleFormSection title="Setup Tags" icon={Hash} defaultOpen={false}>
              <TagSelector
                tags={allSetupTags}
                selectedTags={formData.setupTags}
                onToggle={handleTagToggle}
              />
            </CollapsibleFormSection>

            {/* Notes & Media - Collapsible */}
            <CollapsibleFormSection title="Notes & Media" icon={FileText} defaultOpen={false}>
              <div className="space-y-4">
                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    rows={2}
                    placeholder="Trade notes..."
                  />
                </div>
                
                {/* Screenshot Section */}
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-300 mb-2">Screenshot</label>
                  
                  {/* Upload Button and URL Input */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Upload Button */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                        id="screenshot-upload"
                        disabled={isReadOnlyMode}
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className={`w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-600/50 rounded-lg transition-all cursor-pointer ${
                          isReadOnlyMode 
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500/50'
                        }`}
                      >
                        <Upload size={14} />
                        <span className="text-sm">Upload Screenshot</span>
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
            </CollapsibleFormSection>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 sm:space-x-3 p-3 sm:p-4 border-t border-gray-700/30 bg-gray-800/20">
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
            className="px-3 sm:px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all text-xs sm:text-sm"
          >
            Cancel
          </button>
          {!isReadOnlyMode && (
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-1 sm:space-x-1.5 shadow-lg text-xs sm:text-sm"
            >
              <Plus size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Add Trade</span>
            </button>
          )}
        </div>

        {/* Pip Settings Modal */}
        {showPipSettingsModal && formData.pair && (
          <PipValueSettingsModal
            pair={formData.pair}
            currentSettings={currentPairSettings || {}}
            onSave={handlePipSettingsSave}
            onClose={() => setShowPipSettingsModal(false)}
          />
        )}
      </div>
    </div>
  );
};