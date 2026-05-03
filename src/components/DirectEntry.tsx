import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, Search, RefreshCw, Database } from 'lucide-react';
import { fetchDirectEntries, saveDirectEntry, deleteDirectEntry, getTenantConfig, TenantConfig } from '../utils/supabase';
import { RawContractData } from '../types';

interface DirectEntryProps {
  onDataLoaded: (data: RawContractData[]) => void;
  existingData?: RawContractData[];
  onAddEntry?: (entry: RawContractData) => void;
}

interface DirectEntryFormData {
  'Serial No.': string;
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
  'Serial No.': '',
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

export const DirectEntry: React.FC<DirectEntryProps> = ({ onDataLoaded, existingData, onAddEntry }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [formData, setFormData] = useState<DirectEntryFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(getTenantConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDirectEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (field: keyof DirectEntryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData['Customer Name'] || !formData['CONTRACT NO.']) {
      showMessage('error', 'Customer Name and Contract No. are required');
      return;
    }

    const success = await saveDirectEntry(formData);
    if (success) {
      showMessage('success', isEditing ? 'Entry updated successfully' : 'Entry added successfully');
      setFormData(initialFormData);
      setIsEditing(false);
      setEditingId(null);
      loadEntries();

      if (onAddEntry && !isEditing) {
        onAddEntry(formData as RawContractData);
      }
    } else {
      showMessage('error', 'Failed to save entry');
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      'Serial No.': entry['Serial No.'] || '',
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
    setIsEditing(true);
    setEditingId(entry.id);
    setIsExpanded(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      const success = await deleteDirectEntry(id);
      if (success) {
        showMessage('success', 'Entry deleted');
        loadEntries();
      } else {
        showMessage('error', 'Failed to delete entry');
      }
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSyncToDashboard = () => {
    if (entries.length > 0) {
      const formattedData = entries.map(entry => ({
        'Serial No.': entry['Serial No.'] || '',
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
      }));
      onDataLoaded(formattedData);
    }
  };

  const filteredEntries = entries.filter(entry =>
    (entry['Customer Name'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry['CONTRACT NO.'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry['DEPARTMENT'] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="laser-beam" />
        <div className="refractive-highlight" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-copper/10 border border-copper/30 rounded-lg">
                <Database className="w-5 h-5 text-copper" />
              </div>
              <div>
                <h2 className="text-2xl font-serif italic text-white">Direct Data Entry</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  Multitenancy: {tenantConfig.tenantId} // {tenantConfig.companyName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {entries.length > 0 && (
                <button
                  onClick={handleSyncToDashboard}
                  className="px-4 py-2 bg-copper text-obsidian font-mono text-[10px] uppercase tracking-widest hover:bg-copper/80 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync to Dashboard ({entries.length})
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                {isEditing ? 'Close Form' : isExpanded ? 'Collapse' : 'Add New Entry'}
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 border ${
                  message.type === 'success'
                    ? 'border-green-900/50 bg-green-950/20 text-green-500'
                    : 'border-red-900/50 bg-red-950/20 text-red-500'
                } font-mono text-[10px] uppercase tracking-widest`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isExpanded && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="mb-8 overflow-hidden"
              >
                <div className="p-6 bg-white/5 border border-white/10 rounded-lg space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Serial No.</label>
                      <input
                        type="text"
                        value={formData['Serial No.']}
                        onChange={(e) => handleInputChange('Serial No.', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="S/N"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Customer Name *</label>
                      <input
                        type="text"
                        value={formData['Customer Name']}
                        onChange={(e) => handleInputChange('Customer Name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="Customer Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Contract No. *</label>
                      <input
                        type="text"
                        value={formData['CONTRACT NO.']}
                        onChange={(e) => handleInputChange('CONTRACT NO.', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="Contract No."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">WBS</label>
                      <input
                        type="text"
                        value={formData['WBS']}
                        onChange={(e) => handleInputChange('WBS', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="WBS Code"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Dhareeba No.</label>
                      <input
                        type="text"
                        value={formData[' Dhareeba No. ']}
                        onChange={(e) => handleInputChange(' Dhareeba No. ', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="Dhareeba No."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Currency</label>
                      <select
                        value={formData['Billing Currency (short name)']}
                        onChange={(e) => handleInputChange('Billing Currency (short name)', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                      >
                        <option value="QAR" className="bg-slate-900">QAR</option>
                        <option value="USD" className="bg-slate-900">USD</option>
                        <option value="EUR" className="bg-slate-900">EUR</option>
                        <option value="GBP" className="bg-slate-900">GBP</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Country</label>
                      <input
                        type="text"
                        value={formData['Project Country Location']}
                        onChange={(e) => handleInputChange('Project Country Location', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="Country"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Department</label>
                      <select
                        value={formData['DEPARTMENT']}
                        onChange={(e) => handleInputChange('DEPARTMENT', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-slate-900">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept} className="bg-slate-900">{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Contract Value QAR</label>
                      <input
                        type="number"
                        value={formData['Contract Value QAR']}
                        onChange={(e) => handleInputChange('Contract Value QAR', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Signing Date</label>
                      <input
                        type="date"
                        value={formData['Signing Date (per contract)-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Signing Date (per contract)-dd/mm/yyy', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Start Date</label>
                      <input
                        type="date"
                        value={formData['Start Date (per contract)-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Start Date (per contract)-dd/mm/yyy', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Est. Completion</label>
                      <input
                        type="date"
                        value={formData['Est. Completion Date-dd/mm/yyy']}
                        onChange={(e) => handleInputChange('Est. Completion Date-dd/mm/yyy', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Remarks</label>
                      <input
                        type="text"
                        value={formData['Remarks']}
                        onChange={(e) => handleInputChange('Remarks', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="Optional remarks"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Comparison Remarks</label>
                      <input
                        type="text"
                        value={formData['Comparison remarks (local vs. Dhareeba)']}
                        onChange={(e) => handleInputChange('Comparison remarks (local vs. Dhareeba)', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                        placeholder="Local vs Dhareeba comparison"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-copper text-obsidian font-mono text-[10px] uppercase tracking-widest hover:bg-copper/80 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-3 h-3" />
                      {isEditing ? 'Update Entry' : 'Save Entry'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search entries..."
                  className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-2 text-white font-mono text-xs focus:border-copper focus:outline-none transition-colors"
                />
              </div>
              <span className="font-mono text-[10px] text-gray-500">{filteredEntries.length} entries</span>
              <button
                onClick={loadEntries}
                className="p-2 hover:bg-white/5 rounded transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-3 font-mono text-[10px] uppercase text-gray-500">Serial</th>
                    <th className="p-3 font-mono text-[10px] uppercase text-gray-500">Customer</th>
                    <th className="p-3 font-mono text-[10px] uppercase text-gray-500">Contract No</th>
                    <th className="p-3 font-mono text-[10px] uppercase text-gray-500">Department</th>
                    <th className="p-3 font-mono text-[10px] uppercase text-gray-500 text-right">Value (QAR)</th>
                    <th className="p-3 font-mono text-[10px] uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center font-mono text-[10px] text-gray-600 uppercase tracking-widest">
                        {isLoading ? 'Loading...' : 'No entries yet. Add your first entry above.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-xs text-gray-400">{entry['Serial No.'] || '-'}</td>
                        <td className="p-3 font-sans text-sm text-white">{entry['Customer Name'] || '-'}</td>
                        <td className="p-3 font-mono text-xs text-white">{entry['CONTRACT NO.'] || '-'}</td>
                        <td className="p-3 font-mono text-xs text-copper">{entry['DEPARTMENT'] || '-'}</td>
                        <td className="p-3 font-mono text-xs text-right text-white">
                          {entry['Contract Value QAR'] ? parseFloat(entry['Contract Value QAR']).toLocaleString() : '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            >
                              <Edit2 className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 hover:bg-red-950/20 rounded transition-colors"
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
    </div>
  );
};