import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit2, Trash2, Save, X, RefreshCw, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAllEntries, bulkSaveEntries, deleteDirectEntry } from '../utils/supabase';
import { RawContractData } from '../types';

interface DirectEntryFormData {
  'Customer Name': string;
  'CONTRACT NO.': string;
  'WBS': string;
  ' Dhareeba No. ': string;
  'Billing Currency (short name)': string;
  'Project Country Location': string;
  'Signing Date (per contract)-dd/mm/yyy': string;
  'Start Date (per contract)-dd/mm/yyy': string;
  'Est. Completion Date-dd/mm/yyy': string;
  'Total Contract Revenue Value *1000 (Est.)': string;
  'Contract Value QAR': string;
  'Remarks': string;
  'DEPARTMENT': string;
  'Comparison remarks (local vs. Dhareeba)': string;
}

const initialFormData: DirectEntryFormData = {
  'Customer Name': '',
  'CONTRACT NO.': '',
  'WBS': '',
  ' Dhareeba No. ': '',
  'Billing Currency (short name)': 'QAR',
  'Project Country Location': '',
  'Signing Date (per contract)-dd/mm/yyy': '',
  'Start Date (per contract)-dd/mm/yyy': '',
  'Est. Completion Date-dd/mm/yyy': '',
  'Total Contract Revenue Value *1000 (Est.)': '',
  'Contract Value QAR': '',
  'Remarks': '',
  'DEPARTMENT': '',
  'Comparison remarks (local vs. Dhareeba)': ''
};

const departments = ['VSS', 'TSS', 'NDT', 'TPI'];

const COLUMN_WIDTHS: Record<string, number> = {
  'Serial No.': 80,
  'Customer Name': 180,
  'CONTRACT NO.': 120,
  'WBS': 100,
  ' Dhareeba No. ': 120,
  'Billing Currency (short name)': 100,
  'Project Country Location': 140,
  'Signing Date (per contract)-dd/mm/yyy': 120,
  'Start Date (per contract)-dd/mm/yyy': 120,
  'Est. Completion Date-dd/mm/yyy': 130,
  'Total Contract Revenue Value *1000 (Est.)': 150,
  'Contract Value QAR': 130,
  'Remarks': 200,
  'DEPARTMENT': 100,
  'Comparison remarks (local vs. Dhareeba)': 200
};

const COLUMN_MIN_WIDTH = 100;
const ACTIONS_WIDTH = 100;
const ROW_HEIGHT = 48;
const VISIBLE_ROWS = 15;

export const RecordManagement: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [formData, setFormData] = useState<DirectEntryFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
      showMessage('error', 'Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleInputChange = (field: keyof DirectEntryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData['Customer Name'] || !formData['CONTRACT NO.']) {
      showMessage('error', 'Customer Name and Contract No. are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const { updateDirectEntry } = await import('../utils/supabase');
        const success = await updateDirectEntry(editingId, formData as RawContractData);
        if (success) {
          showMessage('success', 'Entry updated successfully');
          setFormData(initialFormData);
          setEditingId(null);
          setShowForm(false);
          loadEntries();
        } else {
          showMessage('error', 'Failed to update entry');
        }
        return;
      }

      const result = await bulkSaveEntries([formData as RawContractData]);
      if (result.success) {
        showMessage('success', 'Entry added successfully');
        setFormData(initialFormData);
        setShowForm(false);
        loadEntries();
      } else {
        showMessage('error', 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      showMessage('error', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      'Customer Name': entry['Customer Name'] || '',
      'CONTRACT NO.': entry['CONTRACT NO.'] || '',
      'WBS': entry['WBS'] || '',
      ' Dhareeba No. ': entry[' Dhareeba No. '] || '',
      'Billing Currency (short name)': entry['Billing Currency (short name)'] || 'QAR',
      'Project Country Location': entry['Project Country Location'] || '',
      'Signing Date (per contract)-dd/mm/yyy': entry['Signing Date (per contract)-dd/mm/yyy'] || '',
      'Start Date (per contract)-dd/mm/yyy': entry['Start Date (per contract)-dd/mm/yyy'] || '',
      'Est. Completion Date-dd/mm/yyy': entry['Est. Completion Date-dd/mm/yyy'] || '',
      'Total Contract Revenue Value *1000 (Est.)': entry['Total Contract Revenue Value *1000 (Est.)'] || '',
      'Contract Value QAR': entry['Contract Value QAR'] || '',
      'Remarks': entry['Remarks'] || '',
      'DEPARTMENT': entry['DEPARTMENT'] || '',
      'Comparison remarks (local vs. Dhareeba)': entry['Comparison remarks (local vs. Dhareeba)'] || ''
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, contractNo: string) => {
    if (!confirm(`Delete record "${contractNo}"?`)) return;

    try {
      const success = await deleteDirectEntry(id);
      if (success) {
        showMessage('success', 'Entry deleted');
        loadEntries();
      } else {
        showMessage('error', 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      showMessage('error', 'Failed to delete entry');
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const columns = useMemo(() => {
    if (entries.length === 0) return Object.keys(initialFormData);
    const firstEntry = entries[0];
    return Object.keys(firstEntry).filter(key => key !== 'id');
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    const term = searchTerm.toLowerCase();
    return entries.filter(entry =>
      columns.some(col =>
        String(entry[col] || '').toLowerCase().includes(term)
      )
    );
  }, [entries, searchTerm, columns]);

  const getColumnWidth = (column: string) => {
    return COLUMN_WIDTHS[column] || COLUMN_MIN_WIDTH;
  };

  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + getColumnWidth(col), 0) + ACTIONS_WIDTH;
  }, [columns]);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = tableContainerRef.current.clientWidth * 0.5;
      const newScrollLeft = direction === 'left'
        ? Math.max(0, tableContainerRef.current.scrollLeft - scrollAmount)
        : tableContainerRef.current.scrollLeft + scrollAmount;
      tableContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  }, []);

  const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined || value === '') return '-';
    if (column.toLowerCase().includes('date')) {
      return String(value);
    }
    if (column.toLowerCase().includes('value') || column.toLowerCase().includes('qar')) {
      const num = parseFloat(String(value).replace(/,/g, ''));
      if (!isNaN(num)) return num.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="w-full min-h-screen bg-[#fff5d9] p-6">
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="laser-beam" />
        <div className="refractive-highlight" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-copper/10 border border-copper/30 rounded-lg">
                <Database className="w-5 h-5 text-copper" />
              </div>
              <div>
                <h2 className="text-2xl font-serif italic text-slate-900">Contract Details</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  View, Edit & Delete Records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadEntries}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/50 text-slate-600 font-mono text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 rounded-lg"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-copper text-obsidian font-mono text-[10px] uppercase tracking-widest hover:bg-copper/90 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-copper/20"
              >
                <Plus className="w-3 h-3" />
                Add New
              </button>
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 border rounded-lg font-mono text-[10px] uppercase tracking-widest ${
                  message.type === 'success'
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="mb-6 overflow-hidden"
              >
                <div className="p-5 bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {editingId ? 'Edit Record' : 'Add New Record'}
                    </h3>
                    <button type="button" onClick={handleCancel} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Customer Name *</label>
                      <input
                        type="text"
                        value={formData['Customer Name']}
                        onChange={(e) => handleInputChange('Customer Name', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Contract No. *</label>
                      <input
                        type="text"
                        value={formData['CONTRACT NO.']}
                        onChange={(e) => handleInputChange('CONTRACT NO.', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">WBS</label>
                      <input
                        type="text"
                        value={formData['WBS']}
                        onChange={(e) => handleInputChange('WBS', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Dhareeba No.</label>
                      <input
                        type="text"
                        value={formData[' Dhareeba No. ']}
                        onChange={(e) => handleInputChange(' Dhareeba No. ', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Currency</label>
                      <select
                        value={formData['Billing Currency (short name)']}
                        onChange={(e) => handleInputChange('Billing Currency (short name)', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      >
                        <option value="QAR">QAR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Country</label>
                      <input
                        type="text"
                        value={formData['Project Country Location']}
                        onChange={(e) => handleInputChange('Project Country Location', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Department</label>
                      <select
                        value={formData['DEPARTMENT']}
                        onChange={(e) => handleInputChange('DEPARTMENT', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      >
                        <option value="">Select</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Contract Value QAR</label>
                      <input
                        type="number"
                        value={formData['Contract Value QAR']}
                        onChange={(e) => handleInputChange('Contract Value QAR', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Signing Date</label>
                      <input
                        type="date"
                        value={formData['Signing Date (per contract)-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Signing Date (per contract)-dd/mm/yyy', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Start Date</label>
                      <input
                        type="date"
                        value={formData['Start Date (per contract)-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Start Date (per contract)-dd/mm/yyy', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Est. Completion</label>
                      <input
                        type="date"
                        value={formData['Est. Completion Date-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Est. Completion Date-dd/mm/yyy', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Remarks</label>
                      <input
                        type="text"
                        value={formData['Remarks']}
                        onChange={(e) => handleInputChange('Remarks', e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-copper text-white text-sm font-medium hover:bg-copper/90 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-copper/20 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Entry'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across all columns..."
                className="w-full bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-copper/30 focus:border-copper focus:outline-none transition-all"
              />
            </div>
            <span className="font-mono text-[10px] text-slate-500 bg-white/50 px-3 py-1.5 rounded-lg">
              {filteredEntries.length} records
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-white/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleScroll('left')}
                  className="p-1.5 bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg hover:bg-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="p-1.5 bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg hover:bg-white transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <span className="font-mono text-[9px] text-slate-400">
                Scroll horizontally to see all columns
              </span>
            </div>

            <div
              ref={tableContainerRef}
              className="overflow-auto max-h-[720px] relative"
              onScroll={handleTableScroll}
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#D97706 #f5f5f5' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: totalWidth }}>
                <thead className="sticky top-0 z-30">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="bg-white/95 backdrop-blur-md border-b border-r border-slate-200 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-slate-600 font-semibold"
                        style={{ width: getColumnWidth(column), minWidth: getColumnWidth(column) }}
                      >
                        <div className="flex flex-col gap-1">
                          <span>{column}</span>
                        </div>
                      </th>
                    ))}
                    <th
                      className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-slate-600 font-semibold sticky right-0"
                      style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12 text-center">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                          No records found
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, rowIndex) => (
                      <tr
                        key={entry.id || rowIndex}
                        className="group hover:bg-copper/5 transition-colors"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="border-b border-r border-slate-100 px-4 py-3 text-sm text-slate-700"
                            style={{ width: getColumnWidth(column), minWidth: getColumnWidth(column) }}
                          >
                            <span className={column === 'Customer Name' ? 'font-medium text-slate-800' : ''}>
                              {formatCellValue(entry[column], column)}
                            </span>
                          </td>
                        ))}
                        <td
                          className="border-b border-slate-100 px-4 py-3 sticky right-0 bg-white group-hover:bg-copper/5 transition-colors"
                          style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH }}
                        >
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 hover:bg-copper/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-copper" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id, entry['CONTRACT NO.'])}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>Showing {filteredEntries.length} of {entries.length} records</span>
            <span>{columns.length} columns displayed</span>
          </div>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #D97706;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #B45309;
        }
        table {
          border-spacing: 0;
        }
        th, td {
          border-spacing: 0;
        }
      `}</style>
    </div>
  );
};