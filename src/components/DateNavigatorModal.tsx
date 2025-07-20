import React, { useState, useEffect } from 'react';
import { Calendar, X, RotateCcw, Clock, Plus, Activity } from 'lucide-react';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay, isToday, getDay } from 'date-fns';

interface DateNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstActivityDate: string | null;
  lastActivityDate: string | null;
  dailyActivity: Record<string, { trades: number; pendingTrades: number }>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export const DateNavigatorModal: React.FC<DateNavigatorModalProps> = ({
  isOpen,
  onClose,
  firstActivityDate,
  lastActivityDate,
  dailyActivity,
  selectedDate,
  onSelectDate
}) => {
  const [tempDate, setTempDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [viewDate, setViewDate] = useState(new Date(selectedDate || new Date().toISOString().split('T')[0]));

  useEffect(() => {
    if (isOpen) {
      const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
      setTempDate(dateToUse);
      setViewDate(new Date(dateToUse));
    }
  }, [isOpen, selectedDate]);

  const handleSelectDate = () => {
    onSelectDate(tempDate);
    onClose();
  };

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setTempDate(dateString);
    setViewDate(date);
  };
  const handleGoToToday = () => {
    onSelectDate(null);
    onClose();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const getActivityIndicator = (dateString: string) => {
    const activity = dailyActivity[dateString];
    if (!activity || (activity.trades === 0 && activity.pendingTrades === 0)) {
      return null;
    }
    
    const total = activity.trades + activity.pendingTrades;
    return (
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full shadow-lg" 
           title={`${total} ${total === 1 ? 'entry' : 'entries'} on this date`} />
    );
  };

  const getNoActivityIndicator = (dateString: string) => {
    const activity = dailyActivity[dateString];
    const hasActivity = activity && (activity.trades > 0 || activity.pendingTrades > 0);
    
    if (hasActivity) return null;
    
    // Only show for dates within the activity range
    if (!firstActivityDate || !lastActivityDate) return null;
    
    const date = parseISO(dateString);
    const firstDate = parseISO(firstActivityDate);
    const lastDate = parseISO(lastActivityDate);
    
    if (date >= firstDate && date <= lastDate) {
      return (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-500 rounded-full opacity-50" 
             title="No new entries on this date" />
      );
    }
    
    return null;
  };
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const minDate = firstActivityDate || today;
  const maxDate = lastActivityDate || today;

  // Generate calendar days
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for proper calendar layout
  const startPadding = getDay(monthStart);
  const paddingDays = Array.from({ length: startPadding }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startPadding - i));
    return date;
  });
  
  const allDays = [...paddingDays, ...calendarDays];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] sm:max-h-[80vh] md:max-h-[70vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Time Travel</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          {/* Custom Calendar */}
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-lg font-semibold text-white">
                {format(viewDate, 'MMMM yyyy')}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-400">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {allDays.map((date, index) => {
                const dateString = format(date, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(date, viewDate);
                const isSelected = tempDate === dateString;
                const isTodayDate = isToday(date);
                const isInRange = dateString >= minDate && dateString <= maxDate;
                const isClickable = isCurrentMonth && isInRange;
                
                return (
                  <button
                    key={index}
                    onClick={() => isClickable && handleDateClick(date)}
                    disabled={!isClickable}
                    className={`relative p-2 text-sm rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isTodayDate
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : isClickable
                        ? 'hover:bg-gray-700/50 text-white'
                        : 'text-gray-600 cursor-not-allowed'
                    } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    {format(date, 'd')}
                    {isCurrentMonth && getActivityIndicator(dateString)}
                    {isCurrentMonth && getNoActivityIndicator(dateString)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Input Fallback */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Or enter date manually
            </label>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500">
              Available range: {format(parseISO(minDate), 'MMM dd, yyyy')} - {format(parseISO(maxDate), 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Legend */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="relative w-4 h-4 bg-gray-700 rounded">
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                </div>
                <span className="text-gray-400">Date with new entries</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative w-4 h-4 bg-gray-700 rounded">
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-500 rounded-full opacity-50" />
                </div>
                <span className="text-gray-400">No new entries (shows previous state)</span>
              </div>
            </div>
          </div>
          {selectedDate && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-orange-400" />
                <span className="text-orange-400 font-medium text-sm">Currently viewing historical data</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">
                Viewing all data up to: {format(parseISO(selectedDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between p-4 sm:p-6 border-t border-gray-700/30 flex-shrink-0">
          <button
            onClick={handleGoToToday}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600/50 text-white rounded-lg hover:bg-gray-600/70 transition-all"
          >
            <RotateCcw size={16} />
            <span>Go to Today</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              View Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};