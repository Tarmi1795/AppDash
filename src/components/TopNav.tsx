import React from 'react';
import { LayoutDashboard, Upload, Database } from 'lucide-react';

interface TopNavProps {
  activeView: 'entry' | 'preview' | 'dashboard' | 'records';
  onNavigate: (view: 'entry' | 'preview' | 'dashboard' | 'records') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="border-b border-amber-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/80 p-1 rounded-lg border border-amber-200">
          <button
            onClick={() => onNavigate('entry')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'entry' || activeView === 'preview' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload / Preview
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('records')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'records' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100'}`}
          >
            <Database className="w-3.5 h-3.5" />
            Contract Details
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src="https://iili.io/qVKkIEu.png"
            alt="Logo"
            className="h-12 w-auto object-contain brightness-110 contrast-125"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </nav>
  );
};