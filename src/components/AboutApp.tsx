import React from 'react';
import { TrendingUp, User, Zap, CloudOff, BarChart3, Shield, Target, Activity, Globe, Code } from 'lucide-react';

export const AboutApp: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* About App Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl shadow-lg">
                <TrendingUp size={28} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">TradingJournal Pro</h2>
                <p className="text-gray-400 text-sm">Professional Trading Analytics</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                A high-performance, offline-first trading journal that tracks metrics, simulates broker logic, and grows with you — even with no internet.
              </p>
              
              <p className="text-gray-300 leading-relaxed">
                Built for serious traders who demand accuracy, analytics, and automation without sacrificing performance.
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Core Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Zap size={16} className="text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm">High Performance</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CloudOff size={16} className="text-green-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Offline First</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <BarChart3 size={16} className="text-purple-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Real-time Analytics</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Shield size={16} className="text-orange-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Privacy Focused</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Target size={16} className="text-cyan-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Broker Logic</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg">
                    <Activity size={16} className="text-pink-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Live Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Creator Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl shadow-lg">
                <User size={28} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Meet the Creator</h2>
                <p className="text-gray-400 text-sm">Solo Developer & Trader</p>
              </div>
            </div>

            {/* Creator Info */}
            <div className="space-y-4">
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                <h3 className="text-xl font-bold text-white mb-3">Nazim Shah</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                      <Globe size={14} className="text-blue-400" />
                    </div>
                    <span className="text-gray-300 text-sm">17 years old • Pakistan</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                      <Code size={14} className="text-purple-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Full-Stack Developer</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-300 leading-relaxed">
                  A passionate trader, builder, and thinker. Built this entire app solo — with full focus on real-world logic and performance.
                </p>
                
                <p className="text-gray-300 leading-relaxed">
                  Committed to creating tools that empower independent traders to thrive in any market condition.
                </p>
              </div>
            </div>

            {/* Philosophy */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Philosophy</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                "Built for focus. Designed for speed. Backed by logic. Trading Journal Pro strips away the noise and focuses on what actually matters."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Line */}
      <div className="text-center pt-6 border-t border-gray-700/30">
        <p className="text-gray-500 text-sm italic">
          Built entirely by Nazim Shah — precision-first, not just aesthetics.
        </p>
      </div>
    </div>
  );
};