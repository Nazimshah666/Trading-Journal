import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Trash2, TrendingUp, TrendingDown, DollarSign, Clock, Target, Hash, FileText, Camera, Brain, AlertTriangle, CheckCircle, XCircle, Info, Wallet, Eye, EyeOff, Star, Maximize, ZoomIn, ZoomOut, Minimize } from 'lucide-react';
import { Trade } from '../types';
import { format, parseISO, parse } from 'date-fns';
import { formatCompactCurrency, formatDuration, formatPercentage, formatCleanNumberDisplay } from '../utils/formatting';
import { formatRRDisplay, hasValidRR } from '../utils/calculations';

interface TradeDetailsModalProps {
  trade: Trade;
  tradeNumber: number;
  onClose: () => void;
  onDelete: (tradeId: string) => void;
  isReadOnlyMode?: boolean;
}

// Helper function to format time to 12-hour format with AM/PM
const formatTimeTo12Hour = (timeString: string): string => {
  try {
    // Parse the time string (HH:mm format) and convert to 12-hour format
    const parsedTime = parse(timeString, 'HH:mm', new Date());
    return format(parsedTime, 'h:mm a');
  } catch (error) {
    // Fallback to original time if parsing fails
    return timeString;
  }
};

// Memoized components for performance
const TradeHeader = React.memo(({ trade, tradeNumber, onClose }: { 
  trade: Trade; 
  tradeNumber: number; 
  onClose: () => void; 
}) => {
  const getResultIcon = () => {
    switch (trade.result) {
      case 'Win': return <CheckCircle size={18} className="text-green-400" />;
      case 'Loss': return <XCircle size={18} className="text-red-400" />;
      default: return <Target size={18} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700/30 bg-gray-800/20">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {getResultIcon()}
          <div>
            <h2 className="text-lg font-bold text-white">Trade #{tradeNumber}</h2>
            <p className="text-gray-400 text-xs">{trade.pair} • {format(parseISO(trade.date), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        {trade.isAPlusSetup && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex items-center">
            ⭐ A+
          </span>
        )}
      </div>
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700/50 transition-all duration-150"
      >
        <X size={20} />
      </button>
    </div>
  );
});

const SummarySection = React.memo(({ trade }: { trade: Trade }) => {
  const getDirectionBadge = () => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      trade.direction === 'Buy' 
        ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
        : 'bg-red-500/15 text-red-400 border border-red-500/20'
    }`}>
      {trade.direction === 'Buy' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
      {trade.direction}
    </span>
  );

  return (
    <div className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Pair</p>
          <p className="text-lg font-bold text-white">{trade.pair}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Type</p>
          <div className="flex justify-center">{getDirectionBadge()}</div>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">P&L</p>
          <p className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trade.pnl >= 0 ? '+' : ''}{formatCompactCurrency(trade.pnl)}
          </p>
        </div>
      </div>
    </div>
  );
});

const InfoGrid = React.memo(({ title, icon: Icon, children }: { 
  title: string; 
  icon: React.ComponentType<{ size: number; className?: string }>; 
  children: React.ReactNode; 
}) => (
  <div className="mb-4">
    <div className="flex items-center space-x-2 mb-3">
      <Icon size={16} className="text-blue-400" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
    <div className="bg-gray-800/20 border border-gray-700/20 rounded-lg p-3">
      {children}
    </div>
  </div>
));

const InfoRow = React.memo(({ label, value, subValue }: { 
  label: string; 
  value: string | number; 
  subValue?: string | React.ReactNode; 
}) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-gray-400 text-xs">{label}</span>
    <div className="text-right">
      <span className="text-white text-sm font-medium">{value}</span>
      {subValue && (
        <div className="text-xs text-gray-500">
          {typeof subValue === 'string' ? subValue : subValue}
        </div>
      )}
    </div>
  </div>
));

const CollapsibleSection = React.memo(({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-gray-800/20 hover:bg-gray-800/40 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Icon size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <TrendingDown size={12} className="text-gray-400" />
        </div>
      </button>
      {isOpen && (
        <div className="mt-2 bg-gray-800/10 border border-gray-700/20 rounded-lg p-3">
          {children}
        </div>
      )}
    </div>
  );
});

// Fullscreen Image Viewer Component
const FullscreenImageViewer = React.memo(({ 
  trade, 
  tradeNumber, 
  onClose 
}: { 
  trade: Trade; 
  tradeNumber: number; 
  onClose: () => void; 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(window.innerWidth >= 1024); // Show by default on desktop
  const [isVisible, setIsVisible] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Smooth entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

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

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for animation to complete
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Zoom functionality
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(5, zoomLevel + delta));
    
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate new pan to zoom towards mouse position
      const zoomRatio = newZoom / zoomLevel;
      const newPanX = mouseX - (mouseX - panX) * zoomRatio;
      const newPanY = mouseY - (mouseY - panY) * zoomRatio;
      
      setZoomLevel(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    }
  }, [zoomLevel, panX, panY]);

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setInitialMouseX(e.clientX - panX);
      setInitialMouseY(e.clientY - panY);
    }
  }, [zoomLevel, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanX(e.clientX - initialMouseX);
      setPanY(e.clientY - initialMouseY);
    }
  }, [isDragging, zoomLevel, initialMouseX, initialMouseY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom slider handler
  const handleZoomSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoomLevel(newZoom);
    // Reset pan when zooming via slider
    if (newZoom === 1) {
      setPanX(0);
      setPanY(0);
    }
  }, []);

  // Reset zoom and pan
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const getCursorStyle = () => {
    if (zoomLevel > 1) {
      return isDragging ? 'grabbing' : 'grab';
    }
    return 'default';
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-60 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110"
        title="Close (ESC)"
      >
        <X size={24} />
      </button>

      {/* Info Panel Toggle (Mobile) */}
      <button
        onClick={() => setShowInfoPanel(!showInfoPanel)}
        className="absolute top-4 left-4 z-60 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110 lg:hidden"
        title="Toggle Info Panel"
      >
        {showInfoPanel ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* Image Container */}
      <div
        ref={imageContainerRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: getCursorStyle() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transformOrigin: '0 0'
          }}
        >
          <img
            src={trade.screenshotLink}
            alt="Trade Screenshot"
            className="max-h-screen max-w-full object-contain select-none"
            draggable={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-3 bg-black/50 backdrop-blur-md rounded-xl p-3 border border-gray-700/50">
          <button
            onClick={() => handleZoomSlider({ target: { value: Math.max(0.5, zoomLevel - 0.2).toString() } } as any)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="text-white" />
          </button>
          
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={zoomLevel}
            onChange={handleZoomSlider}
            className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
          />
          
          <button
            onClick={() => handleZoomSlider({ target: { value: Math.min(5, zoomLevel + 0.2).toString() } } as any)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} className="text-white" />
          </button>
          
          <div className="w-px h-6 bg-gray-600" />
          
          <button
            onClick={resetZoom}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Reset Zoom"
          >
            <Minimize size={16} className="text-white" />
          </button>
          
          <span className="text-white text-xs font-mono min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Contextual Info Panel */}
      <div className={`fixed right-4 top-1/2 -translate-y-1/2 z-60 transition-all duration-300 ${
        showInfoPanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'
      }`}>
        <div className="bg-black/30 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 max-w-xs w-80 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/30">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Info size={14} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-sm">Trade #{tradeNumber}</h3>
            </div>
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
              title="Hide Panel"
            >
              <EyeOff size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Trade Info */}
          <div className="space-y-4 text-sm text-neutral-300">
            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pair</span>
                <span className="text-white font-medium">{trade.pair}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Direction</span>
                <span className={`font-medium ${trade.direction === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.direction}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Result</span>
                <span className={`font-medium ${
                  trade.result === 'Win' ? 'text-green-400' : 
                  trade.result === 'Loss' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {trade.result}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-700/30 pt-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target size={12} className="text-purple-400" />
                <span className="text-gray-300 font-medium text-xs">Strategy</span>
              </div>
              <p className="text-white">{trade.strategy}</p>
            </div>

            <div className="border-t border-gray-700/30 pt-3">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign size={12} className="text-green-400" />
                <span className="text-gray-300 font-medium text-xs">Lot Size</span>
              </div>
              <p className="text-white font-mono">{formatCleanNumberDisplay(trade.lotSize)}</p>
            </div>

            {trade.setupTags && trade.setupTags.length > 0 && (
              <div className="border-t border-gray-700/30 pt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Hash size={12} className="text-blue-400" />
                  <span className="text-gray-300 font-medium text-xs">Setup Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {trade.setupTags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-700/30 pt-3">
              <div className="flex items-center space-x-2 mb-2">
                <Brain size={12} className="text-cyan-400" />
                <span className="text-gray-300 font-medium text-xs">Emotion Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(trade.emotionRating / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm font-medium">{trade.emotionRating}/10</span>
              </div>
            </div>

            {trade.isAPlusSetup && (
              <div className="border-t border-gray-700/30 pt-3">
                <div className="flex items-center space-x-2">
                  <Star size={12} className="text-yellow-400" />
                  <span className="text-yellow-400 font-medium text-xs">A+ Setup</span>
                </div>
              </div>
            )}

            {/* R:R Info */}
            {hasValidRR(trade) && (
              <div className="border-t border-gray-700/30 pt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Target size={12} className="text-orange-400" />
                  <span className="text-gray-300 font-medium text-xs">Risk:Reward</span>
                </div>
                <p className="text-white font-mono text-lg">{formatRRDisplay(trade.rrRatio)}</p>
              </div>
            )}

            {/* P&L */}
            <div className="border-t border-gray-700/30 pt-3">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign size={12} className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'} />
                <span className="text-gray-300 font-medium text-xs">P&L</span>
              </div>
              <p className={`font-mono text-lg ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trade.pnl >= 0 ? '+' : ''}{formatCompactCurrency(trade.pnl)}
              </p>
            </div>

            {trade.notes && (
              <div className="border-t border-gray-700/30 pt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={12} className="text-gray-400" />
                  <span className="text-gray-300 font-medium text-xs">Notes</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{trade.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  trade,
  tradeNumber,
  onClose,
  onDelete,
  isReadOnlyMode = false
}) => {
  const [isScreenshotExpanded, setIsScreenshotExpanded] = useState(false);
  const [showFullscreenScreenshot, setShowFullscreenScreenshot] = useState(false);

  // Memoized calculations
  const calculations = useMemo(() => {
    const slDistancePips = trade.stopLoss 
      ? Math.abs((trade.entryPrice - trade.stopLoss) / trade.pipSize).toFixed(1)
      : '—';
    
    const tpDistancePips = trade.takeProfit 
      ? Math.abs((trade.takeProfit - trade.entryPrice) / trade.pipSize).toFixed(1)
      : '—';

    const pnlInPips = ((trade.direction === 'Buy' 
      ? (trade.exitPrice - trade.entryPrice) 
      : (trade.entryPrice - trade.exitPrice)) / trade.pipSize).toFixed(1);

    const effectivePipValue = (trade.lotSize * trade.pipValuePerStandardLot).toFixed(2);

    // Calculate balance before and after trade
    const balanceBeforeTrade = trade.equity - trade.pnl;
    const balanceAfterTrade = trade.equity;

    return { 
      slDistancePips, 
      tpDistancePips, 
      pnlInPips, 
      effectivePipValue,
      balanceBeforeTrade,
      balanceAfterTrade
    };
  }, [trade]);

  // NEW: Calculate TP outcome status
  const tpOutcomeStatus = useMemo(() => {
    if (!trade.takeProfit) return null;
    
    let slHit = false;
    let tpHit = false;
    
    // Check if SL was hit first
    if (trade.stopLoss) {
      if (trade.direction === 'Buy') {
        slHit = trade.exitPrice <= trade.stopLoss;
      } else {
        slHit = trade.exitPrice >= trade.stopLoss;
      }
    }
    
    // Check if TP was hit (only if SL wasn't hit)
    if (trade.direction === 'Buy') {
      tpHit = trade.exitPrice >= trade.takeProfit;
    } else {
      tpHit = trade.exitPrice <= trade.takeProfit;
    }
    
    // Prioritize SL hit over TP hit
    if (slHit) {
      return { text: 'SL Hit', color: 'text-red-400' };
    } else if (tpHit) {
      return {text: 'TP Target Hit', color: 'text-green-400' };
    } else {
      return { text: 'Manually Closed', color: 'text-gray-500' };
    }
  }, [trade]);

  const handleDelete = useCallback(() => {
    onDelete(trade.id);
    onClose();
  }, [trade.id, onDelete, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Modal Container - Optimized for mobile */}
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-hidden">
          
          {/* Header */}
          <TradeHeader trade={trade} tradeNumber={tradeNumber} onClose={onClose} />

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              
              {/* Summary */}
              <SummarySection trade={trade} />

              {/* Equity Impact */}
              <InfoGrid title="Equity Impact" icon={Wallet}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoRow 
                      label="Balance Before Trade" 
                      value={formatCompactCurrency(calculations.balanceBeforeTrade)} 
                    />
                    <InfoRow 
                      label="Balance After Trade" 
                      value={formatCompactCurrency(calculations.balanceAfterTrade)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <InfoRow 
                      label="Trade Impact" 
                      value={`${trade.pnl >= 0 ? '+' : ''}${formatCompactCurrency(trade.pnl)}`} 
                    />
                    <InfoRow 
                      label="Capital Change" 
                      value={`${trade.changeInCapital >= 0 ? '+' : ''}${formatPercentage(trade.changeInCapital)}`} 
                    />
                  </div>
                </div>
              </InfoGrid>

              {/* Entry/Exit Info */}
              <InfoGrid title="Entry/Exit" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoRow label="Entry" value={trade.entryPrice} />
                    <InfoRow label="Exit" value={trade.exitPrice} />
                  </div>
                  <div className="space-y-2">
                    <InfoRow 
                      label="Stop Loss" 
                      value={trade.stopLoss || '—'} 
                      subValue={trade.stopLoss ? `${calculations.slDistancePips} pips` : undefined}
                    />
                    <InfoRow 
                      label="Take Profit" 
                      value={trade.takeProfit || '—'} 
                      subValue={tpOutcomeStatus ? (
                                                <span className={tpOutcomeStatus.color}>{tpOutcomeStatus.text}</span>
                      ) : (trade.takeProfit ? `${calculations.tpDistancePips} pips` : undefined)}
                    />
                  </div>
                </div>
              </InfoGrid>

              {/* Risk Metrics */}
              <InfoGrid title="Risk Metrics" icon={Target}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoRow label="Risk $" value={trade.risk > 0 ? formatCompactCurrency(trade.risk) : '—'} />
                    <InfoRow label="Lot Size" value={formatCleanNumberDisplay(trade.lotSize)} />
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="R:R Ratio" value={hasValidRR(trade) ? formatRRDisplay(trade.rrRatio) : '—'} />
                    <InfoRow label="P&L Pips" value={`${parseFloat(calculations.pnlInPips) >= 0 ? '+' : ''}${calculations.pnlInPips}`} />
                  </div>
                </div>
              </InfoGrid>

              {/* Collapsible Sections */}
              <CollapsibleSection title="Trade Details" icon={Clock}>
                <div className="space-y-2">
                  <InfoRow label="Hold Time" value={formatDuration(trade.duration)} />
                  <InfoRow 
                    label="Entry Time" 
                    value={`${format(parseISO(trade.date), 'MMM dd')} at ${formatTimeTo12Hour(trade.entryTime)}`} 
                  />
                  <InfoRow 
                    label="Exit Time" 
                    value={`${trade.isMultiDay && trade.exitDate 
                      ? format(parseISO(trade.exitDate), 'MMM dd') 
                      : format(parseISO(trade.date), 'MMM dd')
                    } at ${formatTimeTo12Hour(trade.exitTime)}`} 
                  />
                  <InfoRow label="Pip Size" value={trade.pipSize} />
                  <InfoRow label="Pip Value" value={`$${calculations.effectivePipValue}`} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Strategy & Psychology" icon={Brain}>
                <div className="space-y-2">
                  <InfoRow label="Strategy" value={trade.strategy} />
                  <InfoRow label="Emotion Rating" value={`${trade.emotionRating}/10`} />
                  {trade.setupTags && trade.setupTags.length > 0 && (
                    <div className="pt-2">
                      <p className="text-gray-400 text-xs mb-2">Setup Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {trade.setupTags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {(trade.notes || trade.screenshotLink) && (
                <CollapsibleSection title="Notes & Media" icon={FileText}>
                  <div className="space-y-4">
                    {/* Screenshot Section */}
                    {trade.screenshotLink && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-gray-400 text-xs font-medium">Trade Screenshot</p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setIsScreenshotExpanded(!isScreenshotExpanded)}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all text-xs"
                            >
                              {isScreenshotExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                              <span>{isScreenshotExpanded ? 'Minimize' : 'Expand'}</span>
                            </button>
                            <button
                              onClick={() => setShowFullscreenScreenshot(true)}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all text-xs border border-blue-500/30"
                              title="Open in fullscreen"
                            >
                              <Maximize size={12} />
                              <span className="hidden sm:inline">Fullscreen</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className={`overflow-hidden rounded-lg border border-gray-700/30 bg-gray-900/30 transition-all duration-300 ${
                          isScreenshotExpanded ? 'max-h-96' : 'max-h-32'
                        }`}>
                          <img 
                            src={trade.screenshotLink} 
                            alt="Trade Screenshot"
                            className={`w-full object-contain transition-all duration-300 cursor-pointer hover:opacity-90 ${
                              isScreenshotExpanded ? 'h-auto' : 'h-32'
                            }`}
                            loading="lazy"
                            onClick={() => setShowFullscreenScreenshot(true)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-32 flex items-center justify-center bg-gray-800/50">
                            <div className="text-center">
                              <Camera size={24} className="mx-auto text-gray-500 mb-2" />
                              <p className="text-gray-400 text-xs">Failed to load screenshot</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Trade Context Information */}
                    <div className="bg-gray-800/20 border border-gray-700/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                        <Brain size={14} className="mr-2 text-purple-400" />
                        Trade Decision Context
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-gray-400">Strategy</span>
                            <p className="text-white text-sm font-medium">{trade.strategy}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-gray-400">Direction</span>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                trade.direction === 'Buy' 
                                  ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
                              }`}>
                                {trade.direction === 'Buy' ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                {trade.direction}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs text-gray-400">R:R Ratio</span>
                            <p className={`text-sm font-medium ${hasValidRR(trade) ? 'text-white' : 'text-gray-500'}`}>
                              {formatRRDisplay(trade.rrRatio)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-gray-400">Emotion Rating</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(trade.emotionRating / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-white text-sm font-medium">{trade.emotionRating}/10</span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs text-gray-400">Setup Quality</span>
                            <div className="mt-1">
                              {trade.isAPlusSetup ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                  <Star size={10} className="mr-1" />
                                  A+ Setup
                                </span>
                              ) : (
                                <span className="text-gray-500 text-sm">Standard Setup</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs text-gray-400">Lot Size</span>
                            <p className="text-white text-sm font-medium">{formatCleanNumberDisplay(trade.lotSize)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Setup Tags */}
                      {trade.setupTags && trade.setupTags.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-700/30">
                          <span className="text-xs text-gray-400 mb-2 block">Setup Tags</span>
                          <div className="flex flex-wrap gap-1">
                            {trade.setupTags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Notes Section */}
                    {trade.notes && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2 font-medium">Trade Notes</p>
                        <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-700/20">
                          <p className="text-white text-sm leading-relaxed">{trade.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-t border-gray-700/30 bg-gray-800/20">
            <div className="text-xs sm:text-sm text-gray-400">
              {format(parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date), 'MMM dd, yyyy')}
            </div>
            {!isReadOnlyMode && (
              <button
                onClick={handleDelete}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-all text-xs"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {showFullscreenScreenshot && trade.screenshotLink && (
        <FullscreenImageViewer
          trade={trade}
          tradeNumber={tradeNumber}
          onClose={() => setShowFullscreenScreenshot(false)}
        />
      )}
    </>
  );
};