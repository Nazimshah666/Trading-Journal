import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { TRADING_PAIRS, CATEGORY_ICONS, SUBCATEGORY_LABELS } from '../constants';

interface PairSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const PairSelector: React.FC<PairSelectorProps> = React.memo(({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    forex: true,
    crypto: false,
    stocks: false,
    indices: false,
    commodities: false
  });

  // Flatten all pairs for search
  const allPairs = useMemo(() => {
    const pairs: Array<{ symbol: string; category: string; subcategory: string }> = [];
    
    Object.entries(TRADING_PAIRS).forEach(([category, subcategories]) => {
      Object.entries(subcategories).forEach(([subcategory, symbols]) => {
        symbols.forEach(symbol => {
          pairs.push({ symbol, category, subcategory });
        });
      });
    });
    
    return pairs;
  }, []);

  // Filter pairs based on search term
  const filteredPairs = useMemo(() => {
    if (!searchTerm) return TRADING_PAIRS;
    
    const filtered: typeof TRADING_PAIRS = {};
    
    Object.entries(TRADING_PAIRS).forEach(([category, subcategories]) => {
      const filteredSubcategories: any = {};
      
      Object.entries(subcategories).forEach(([subcategory, symbols]) => {
        const matchingSymbols = symbols.filter(symbol =>
          symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingSymbols.length > 0) {
          filteredSubcategories[subcategory] = matchingSymbols;
        }
      });
      
      if (Object.keys(filteredSubcategories).length > 0) {
        filtered[category as keyof typeof TRADING_PAIRS] = filteredSubcategories;
      }
    });
    
    return filtered;
  }, [searchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Ensure search input gets focus when dropdown opens
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder="Search trading pairs..."]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    // Clear any potential focus issues
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between transition-all duration-150 ${className}`}
      >
        <span className="truncate">{value || 'Select trading pair...'}</span>
        <ChevronDown size={16} className={`transition-transform duration-150 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur-xl border border-gray-600/50 rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden w-full min-w-[320px] sm:min-w-[400px] lg:min-w-[500px]">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-700/50 bg-gray-800/30">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search trading pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Categories */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
            {Object.entries(filteredPairs).map(([category, subcategories]) => (
              <div key={category} className="border-b border-gray-700/30 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                    <span className="text-white font-medium capitalize">{category}</span>
                  </div>
                  {expandedCategories[category] ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>

                {expandedCategories[category] && (
                  <div className="bg-gray-800/20">
                    {Object.entries(subcategories).map(([subcategory, symbols]) => (
                      <div key={subcategory} className="px-6 py-4">
                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                          {SUBCATEGORY_LABELS[category as keyof typeof SUBCATEGORY_LABELS]?.[subcategory as keyof typeof SUBCATEGORY_LABELS[keyof typeof SUBCATEGORY_LABELS]] || subcategory}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                          {symbols.map((symbol) => (
                            <button
                              key={symbol}
                              type="button"
                              onClick={() => handleSelect(symbol)}
                              className={`px-3 py-2.5 text-sm rounded-lg transition-all duration-150 text-center font-medium min-h-[40px] flex items-center justify-center ${
                                value === symbol
                                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                  : 'text-gray-300 hover:bg-gray-600/50 hover:text-white hover:transform hover:scale-105'
                              }`}
                            >
                              <span className="truncate">{symbol}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {Object.keys(filteredPairs).length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No trading pairs found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClose}
        />
      )}
    </div>
  );
});

PairSelector.displayName = 'PairSelector';