import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronDown, Download, Upload, RotateCcw, BookOpen, FolderOpen, MoreHorizontal } from 'lucide-react';
import { Journal } from '../types';

interface JournalSelectorProps {
  journals: Journal[];
  activeJournalId: string;
  onJournalChange: (journalId: string) => void;
  onCreateJournal: (name: string, type: Journal['type']) => void;
  onRenameJournal: (journalId: string, newName: string) => void;
  onDeleteJournal: (journalId: string) => void;
  onResetJournal: (journalId: string) => void;
  onExportJournal: (journalId: string) => void;
  onImportJournal: (file: File) => void;
  isReadOnlyMode?: boolean;
}

export const JournalSelector: React.FC<JournalSelectorProps> = ({
  journals,
  activeJournalId,
  onJournalChange,
  onCreateJournal,
  onRenameJournal,
  onDeleteJournal,
  onResetJournal,
  onExportJournal,
  onImportJournal,
  isReadOnlyMode = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [newJournalName, setNewJournalName] = useState('');
  const [newJournalType, setNewJournalType] = useState<Journal['type']>('Mixed');

  const activeJournal = journals.find(j => j.id === activeJournalId);

  const handleCreateJournal = () => {
    if (newJournalName.trim()) {
      onCreateJournal(newJournalName.trim(), newJournalType);
      setNewJournalName('');
      setNewJournalType('Mixed');
      setShowCreateModal(false);
    }
  };

  const handleRenameJournal = () => {
    if (newJournalName.trim() && selectedJournalId) {
      onRenameJournal(selectedJournalId, newJournalName.trim());
      setNewJournalName('');
      setSelectedJournalId('');
      setShowRenameModal(false);
    }
  };

  const handleDeleteJournal = () => {
    if (selectedJournalId) {
      onDeleteJournal(selectedJournalId);
      setSelectedJournalId('');
      setShowDeleteModal(false);
    }
  };

  const handleResetJournal = () => {
    if (selectedJournalId) {
      onResetJournal(selectedJournalId);
      setSelectedJournalId('');
      setShowResetModal(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportJournal(file);
      event.target.value = '';
      setIsDropdownOpen(false);
    }
  };

  const getJournalIcon = (type: Journal['type']) => {
    const icons = {
      Forex: <BookOpen size={14} className="text-blue-400" />,
      Crypto: <BookOpen size={14} className="text-orange-400" />,
      Stocks: <BookOpen size={14} className="text-green-400" />,
      Indices: <BookOpen size={14} className="text-purple-400" />,
      Commodities: <BookOpen size={14} className="text-yellow-400" />,
      Mixed: <BookOpen size={14} className="text-gray-400" />
    };
    return icons[type];
  };

  const openRenameModal = (journalId: string, currentName: string) => {
    setSelectedJournalId(journalId);
    setNewJournalName(currentName);
    setShowRenameModal(true);
    setIsDropdownOpen(false);
    setOpenDropdownId(null);
  };

  const openDeleteModal = (journalId: string) => {
    setSelectedJournalId(journalId);
    setShowDeleteModal(true);
    setIsDropdownOpen(false);
    setOpenDropdownId(null);
  };

  const openResetModal = (journalId: string) => {
    setSelectedJournalId(journalId);
    setShowResetModal(true);
    setIsDropdownOpen(false);
    setOpenDropdownId(null);
  };

  const toggleDropdown = (journalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === journalId ? null : journalId);
  };

  return (
    <div className="relative">
      {/* Journal Selector Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
          isDropdownOpen 
            ? 'text-blue-400 bg-blue-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="Switch Journal"
      >
        <FolderOpen size={14} className="sm:w-4 sm:h-4" />
      </button>

      {/* Enhanced Journal Dropdown with All Actions */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl z-50">
          {/* Header with Actions */}
          <div className="p-4 border-b border-gray-700/30">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm">Switch Journal</h3>
              
              {/* Action Icons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onExportJournal(activeJournalId);
                    setIsDropdownOpen(false);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                  title="Export Journal"
                  disabled={isReadOnlyMode}
                >
                  <Download size={14} />
                </button>
                
                <label className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all cursor-pointer" title="Import Journal">
                  <Upload size={14} />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                    disabled={isReadOnlyMode}
                  />
                </label>
              </div>
            </div>
          </div>
          
          {/* Journal List */}
          <div className="max-h-60 overflow-y-auto">
            {journals.map((journal) => (
              <div
                key={journal.id}
                className={`flex items-center justify-between p-3 transition-colors ${
                  journal.id === activeJournalId
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <button
                  onClick={() => {
                    onJournalChange(journal.id);
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center space-x-3 flex-1 text-left"
                >
                  {getJournalIcon(journal.type)}
                  <div>
                    <div className="font-medium text-sm">{journal.name}</div>
                    <div className="text-xs opacity-75">{journal.trades.length} trades</div>
                  </div>
                </button>
                
                {/* Three-dots Menu */}
                <div className="relative ml-2">
                  <button
                    onClick={(e) => toggleDropdown(journal.id, e)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                    title="Journal Actions"
                    disabled={isReadOnlyMode}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openDropdownId === journal.id && !isReadOnlyMode && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-lg shadow-xl z-50">
                      <div className="py-1">
                        <button
                          onClick={() => openRenameModal(journal.id, journal.name)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all"
                        >
                          <Edit3 size={12} />
                          <span>Rename</span>
                        </button>
                        
                        <button
                          onClick={() => openDeleteModal(journal.id)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                          disabled={journals.length <= 1}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                        
                        <button
                          onClick={() => openResetModal(journal.id)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-all"
                        >
                          <RotateCcw size={12} />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Create New Journal */}
          {!isReadOnlyMode && (
            <div className="p-3 border-t border-gray-700/30">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center space-x-2 p-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                <Plus size={14} />
                <span>New Journal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsDropdownOpen(false);
            setOpenDropdownId(null);
          }}
        />
      )}

      {/* Create Journal Modal - Fixed Positioning with 20% Top Margin */}
      {showCreateModal && !isReadOnlyMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-3 pt-4 sm:pt-12 lg:pt-[15vh]">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700/30 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Create New Journal</h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Journal Name</label>
                <input
                  type="text"
                  value={newJournalName}
                  onChange={(e) => setNewJournalName(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Forex Trading, Crypto Portfolio"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Journal Type</label>
                <select
                  value={newJournalType}
                  onChange={(e) => setNewJournalType(e.target.value as Journal['type'])}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Mixed" className="bg-gray-800 text-white">Mixed Assets</option>
                  <option value="Forex" className="bg-gray-800 text-white">Forex</option>
                  <option value="Crypto" className="bg-gray-800 text-white">Cryptocurrency</option>
                  <option value="Stocks" className="bg-gray-800 text-white">Stocks</option>
                  <option value="Indices" className="bg-gray-800 text-white">Indices</option>
                  <option value="Commodities" className="bg-gray-800 text-white">Commodities</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700/30 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewJournalName('');
                  setNewJournalType('Mixed');
                }}
                className="px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJournal}
                disabled={!newJournalName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal - Fixed Positioning with 20% Top Margin */}
      {showRenameModal && !isReadOnlyMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-3 pt-4 sm:pt-12 lg:pt-[15vh]">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700/30 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Rename Journal</h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">New Name</label>
              <input
                type="text"
                value={newJournalName}
                onChange={(e) => setNewJournalName(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700/30 flex-shrink-0">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setNewJournalName('');
                  setSelectedJournalId('');
                }}
                className="px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameJournal}
                disabled={!newJournalName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && !isReadOnlyMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Delete Journal</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300">
                Are you sure you want to delete "{journals.find(j => j.id === selectedJournalId)?.name}"? This action cannot be undone and will permanently remove all trades and data.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700/30">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedJournalId('');
                }}
                className="px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJournal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Delete Journal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && !isReadOnlyMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <RotateCcw size={20} className="text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Reset Journal</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300">
                This will clear all trades from "{journals.find(j => j.id === selectedJournalId)?.name}" but keep journal settings. This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700/30">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedJournalId('');
                }}
                className="px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetJournal}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all flex items-center space-x-2"
              >
                <RotateCcw size={16} />
                <span>Reset Journal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};