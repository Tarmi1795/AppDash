import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Upload, Sun, Moon } from 'lucide-react';

interface TopNavProps {
  activeView: 'entry' | 'preview' | 'dashboard';
  onNavigate: (view: 'entry' | 'preview' | 'dashboard') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeView, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b border-white/10 bg-[#121626]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
      <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => onNavigate('entry')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'entry' || activeView === 'preview' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload / Preview
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <div className="flex items-center gap-4">
            <img
              src="https://iili.io/qVKkIEu.png"
              alt="Logo"
              className="h-12 w-auto object-contain brightness-110 contrast-125"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};