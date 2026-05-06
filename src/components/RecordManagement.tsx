import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit2, Trash2, Save, X, RefreshCw, Database } from 'lucide-react';
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

export const RecordManagement: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [formData, setFormData] = useState<DirectEntryFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const filteredEntries = entries.filter(entry =>
    (entry['Customer Name'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry['CONTRACT NO.'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry['DEPARTMENT'] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-[#fff5d9] min-h-screen">
      <div className="glass-card p-8 relative overflow-hidden border-amber-200">
        <div className="laser-beam" />
        <div className="refractive-highlight" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-copper/10 border border-copper/30 rounded-lg">
                <Database className="w-5 h-5 text-copper" />
              </div>
              <div>
                <h2 className="text-2xl font-serif italic text-slate-900">Record Management</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  View, Edit & Delete Records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadEntries}
                className="px-4 py-2 bg-white border border-amber-200 text-slate-600 font-mono text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-copper text-obsidian font-mono text-[10px] uppercase tracking-widest hover:bg-copper/80 transition-colors flex items-center gap-2"
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
                className={`mb-6 p-4 border rounded-lg font-mono text-[10px] uppercase tracking-widest ${
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
                className="mb-8 overflow-hidden"
              >
                <div className="p-6 bg-white border border-amber-200 rounded-lg space-y-6 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {editingId ? 'Edit Record' : 'Add New Record'}
                    </h3>
                    <button type="button" onClick={handleCancel} className="p-1 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Customer Name *</label>
                      <input
                        type="text"
                        value={formData['Customer Name']}
                        onChange={(e) => handleInputChange('Customer Name', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Contract No. *</label>
                      <input
                        type="text"
                        value={formData['CONTRACT NO.']}
                        onChange={(e) => handleInputChange('CONTRACT NO.', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">WBS</label>
                      <input
                        type="text"
                        value={formData['WBS']}
                        onChange={(e) => handleInputChange('WBS', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Dhareeba No.</label>
                      <input
                        type="text"
                        value={formData[' Dhareeba No. ']}
                        onChange={(e) => handleInputChange(' Dhareeba No. ', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Currency</label>
                      <select
                        value={formData['Billing Currency (short name)']}
                        onChange={(e) => handleInputChange('Billing Currency (short name)', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
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
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Department</label>
                      <select
                        value={formData['DEPARTMENT']}
                        onChange={(e) => handleInputChange('DEPARTMENT', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
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
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Signing Date</label>
                      <input
                        type="date"
                        value={formData['Signing Date (per contract)-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Signing Date (per contract)-dd/mm/yyy', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Start Date</label>
                      <input
                        type="date"
                        value={formData['Start Date (per contract)-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Start Date (per contract)-dd/mm/yyy', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Est. Completion</label>
                      <input
                        type="date"
                        value={formData['Est. Completion Date-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Est. Completion Date-dd/mm/yyy', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500">Remarks</label>
                      <input
                        type="text"
                        value={formData['Remarks']}
                        onChange={(e) => handleInputChange('Remarks', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 pt-4 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-copper text-white text-sm font-medium hover:bg-copper/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Entry'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search records..."
                className="w-full bg-white border border-amber-200 rounded pl-9 pr-3 py-2 text-slate-900 font-mono text-xs focus:border-copper focus:outline-none transition-colors"
              />
            </div>
            <span className="font-mono text-[10px] text-slate-500">{filteredEntries.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50">
                  <th className="p-3 font-mono text-[10px] uppercase text-slate-500">Customer</th>
                  <th className="p-3 font-mono text-[10px] uppercase text-slate-500">Contract No</th>
                  <th className="p-3 font-mono text-[10px] uppercase text-slate-500">Department</th>
                  <th className="p-3 font-mono text-[10px] uppercase text-slate-500 text-right">Value (QAR)</th>
                  <th className="p-3 font-mono text-[10px] uppercase text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                      Loading...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-amber-100 hover:bg-amber-50/50 transition-colors">
                      <td className="p-3 font-sans text-sm text-slate-800">{entry['Customer Name'] || '-'}</td>
                      <td className="p-3 font-mono text-xs text-slate-700">{entry['CONTRACT NO.'] || '-'}</td>
                      <td className="p-3 font-mono text-xs text-copper">{entry['DEPARTMENT'] || '-'}</td>
                      <td className="p-3 font-mono text-xs text-right text-slate-700">
                        {entry['Contract Value QAR'] ? parseFloat(String(entry['Contract Value QAR'])).toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id, entry['CONTRACT NO.'])}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
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
      </div>
    </div>
  );
};