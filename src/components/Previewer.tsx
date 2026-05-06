import React, { useState, useCallback } from 'react';
import { RawContractData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Upload, FileText, Search, PenLine, Save, X } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { parseFile, generateTemplate } from '../utils/fileUtils';
import { bulkSaveEntries } from '../utils/supabase';

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

interface PreviewerProps {
  data?: RawContractData[];
  onDataLoaded?: (data: RawContractData[]) => void;
  onConfirm?: (data: RawContractData[]) => void;
  onCancel?: () => void;
}

export const Previewer: React.FC<PreviewerProps> = ({ data, onDataLoaded, onConfirm, onCancel }) => {
  const [entries, setEntries] = useState<RawContractData[]>(data || []);
  const [editableData, setEditableData] = useState<RawContractData[]>(data || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState<DirectEntryFormData>(initialFormData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const headers = entries.length > 0 ? Object.keys(entries[0]) : Object.keys(initialFormData);

  const isStandalone = !data;
  const hasData = entries.length > 0;

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const parsedData = await parseFile(file);
      if (parsedData && parsedData.length > 0) {
        setEntries(parsedData);
        setEditableData(parsedData);
        if (onDataLoaded) {
          onDataLoaded(parsedData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleCellChange = (rowIndex: number, key: keyof RawContractData, value: string) => {
    const newData = [...editableData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setEditableData(newData);
  };

  const formatValue = (val: any, header: string) => {
    if (val === null || val === undefined || val === '') return '';
    const isDateColumn = header.toLowerCase().includes('date');
    if (isDateColumn) {
      const date = new Date(val);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy');
      }
    }
    const strVal = String(val);
    const num = parseFloat(strVal.replace(/,/g, ''));
    return !isNaN(num) && !isDateColumn ? num.toLocaleString('en-US') : strVal;
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await bulkSaveEntries(editableData);
      if (!result.success) {
        throw new Error('Save failed');
      }
      if (onConfirm) {
        onConfirm(editableData);
      }
    } catch (err) {
      console.error('Error during confirm:', err);
      alert('Failed to save. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: keyof DirectEntryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData['Customer Name'] || !formData['CONTRACT NO.']) {
      alert('Customer Name and Contract No. are required');
      return;
    }
    const newEntry = { ...formData } as RawContractData;
    if (editingIndex !== null) {
      const newData = [...editableData];
      newData[editingIndex] = newEntry;
      setEditableData(newData);
      setEditingIndex(null);
    } else {
      setEditableData([...editableData, newEntry]);
    }
    setFormData(initialFormData);
    setShowForm(false);
  };

  const handleEdit = (index: number) => {
    const entry = editableData[index];
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
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDeleteRow = (index: number) => {
    if (confirm('Delete this row?')) {
      const newData = editableData.filter((_, i) => i !== index);
      setEditableData(newData);
      setEntries(newData);
    }
  };

  const handleCancelForm = () => {
    setFormData(initialFormData);
    setEditingIndex(null);
    setShowForm(false);
  };

  const filteredData = hasData
    ? editableData.filter(entry =>
        (entry['Customer Name'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry['CONTRACT NO.'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry['DEPARTMENT'] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (isStandalone && !hasData) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #D97706 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">System v2.0 // Contract Analysis Dashboard</span>
              <h1 className="text-6xl md:text-7xl font-light leading-[0.9] tracking-tighter text-slate-900">
                Applus <br />
                <span className="italic font-serif text-copper">Velosi.</span>
              </h1>
            </div>

            <p className="text-slate-600 font-sans text-sm leading-relaxed max-w-sm">
              Transform raw, inconsistent project data into a precision-prorated monthly revenue model.
              Engineered for absolute accuracy in financial forecasting.
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={generateTemplate}
                className="group flex items-center gap-4 px-6 py-3 bg-copper/10 border border-copper/30 rounded-lg hover:bg-copper hover:text-obsidian transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.1)] hover:shadow-[0_0_30px_rgba(217,119,6,0.3)]"
              >
                <FileText className="w-4 h-4 text-copper group-hover:text-obsidian transition-colors" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em]">Download Blank Template</span>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
            className="lg:col-span-7"
          >
            <div
              className={`relative group h-[450px] border border-amber-200 bg-amber-50/50 backdrop-blur-sm transition-all duration-500 overflow-hidden cursor-pointer ${isDragging ? 'border-copper scale-[1.02]' : 'hover:border-amber-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="noise-bg" />
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-copper/40" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-copper/40" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-copper/40" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-copper/40" />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="w-12 h-12 border-2 border-copper border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-copper">Analyzing Data Stream...</p>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="relative inline-block">
                        <Upload className={`w-12 h-12 transition-transform duration-500 ${isDragging ? 'scale-110 text-copper' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <div className="absolute -inset-4 border border-copper/0 group-hover:border-copper/20 rounded-full transition-all duration-500 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-serif italic text-slate-800">Initialize Upload</h3>
                        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                          Drag CSV/XLSX or <span className="text-copper underline cursor-pointer">Browse Local</span>
                        </p>
                      </div>
                      <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> UTF-8</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>CSV / XLSX</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>Max 50MB</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input id="file-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto p-8 space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-slate-900">
          {hasData ? 'Preview & Edit' : 'Upload'}
        </h2>
        {!isProcessing && hasData && (
          <div className="flex gap-4">
            {onCancel && (
              <button onClick={onCancel} className="px-6 py-2 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm font-medium">Cancel</button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-2 border border-copper/30 text-copper hover:bg-copper/10 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <PenLine className="w-4 h-4" />
              {showForm ? 'Hide Form' : '+ Add Row'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-6 py-2 bg-copper text-white text-sm font-medium hover:bg-copper/80 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Save className="w-4 h-4" /> Confirm & Process</>}
            </button>
          </div>
        )}
      </div>

      {!hasData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Upload className="w-16 h-16 mx-auto text-slate-400" />
            <p className="text-slate-500 font-mono text-sm">No data uploaded yet</p>
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="px-6 py-3 bg-copper text-white font-mono text-sm hover:bg-copper/80 transition-colors"
            >
              Upload Excel File
            </button>
            <input id="file-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddEntry}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingIndex !== null ? 'Edit Row' : 'Add New Row'}
                </h3>
                <button type="button" onClick={handleCancelForm} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Serial No.</label>
                  <input type="text" value={formData['Serial No.']} onChange={(e) => handleInputChange('Serial No.', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Customer Name *</label>
                  <input type="text" value={formData['Customer Name']} onChange={(e) => handleInputChange('Customer Name', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Contract No. *</label>
                  <input type="text" value={formData['CONTRACT NO.']} onChange={(e) => handleInputChange('CONTRACT NO.', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">WBS</label>
                  <input type="text" value={formData['WBS']} onChange={(e) => handleInputChange('WBS', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Dhareeba No.</label>
                  <input type="text" value={formData[' Dhareeba No. ']} onChange={(e) => handleInputChange(' Dhareeba No. ', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Currency</label>
                  <select value={formData['Billing Currency (short name)']} onChange={(e) => handleInputChange('Billing Currency (short name)', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper">
                    <option value="QAR">QAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Country</label>
                  <input type="text" value={formData['Project Country Location']} onChange={(e) => handleInputChange('Project Country Location', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Department</label>
                  <select value={formData['DEPARTMENT']} onChange={(e) => handleInputChange('DEPARTMENT', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper">
                    <option value="">Select</option>
                    {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Contract Value QAR</label>
                  <input type="number" value={formData['Contract Value QAR']} onChange={(e) => handleInputChange('Contract Value QAR', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Signing Date</label>
                  <input type="date" value={formData['Signing Date (per contract)-dd/mm/yyy']} onChange={(e) => handleInputChange('Signing Date (per contract)-dd/mm/yyy', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Start Date</label>
                  <input type="date" value={formData['Start Date (per contract)-dd/mm/yyy']} onChange={(e) => handleInputChange('Start Date (per contract)-dd/mm/yyy', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500">Est. Completion</label>
                  <input type="date" value={formData['Est. Completion Date-dd/mm/yyy']} onChange={(e) => handleInputChange('Est. Completion Date-dd/mm/yyy', e.target.value)} className="w-full bg-transparent border-b border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:border-copper" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button type="button" onClick={handleCancelForm} className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-copper text-white text-sm font-medium hover:bg-copper/80 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingIndex !== null ? 'Update Row' : 'Add Row'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {hasData && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search entries..." className="w-full bg-white border border-slate-200 rounded pl-9 pr-3 py-2 text-slate-900 font-mono text-xs focus:border-copper focus:outline-none transition-colors" />
            </div>
            <span className="font-mono text-[10px] text-slate-500">{filteredData.length} entries</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-amber-50">
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">#</th>
                  {headers.map(h => (
                    <th key={h} className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-slate-100 hover:bg-amber-50/50 transition-colors">
                    <td className="p-3 text-xs text-slate-400 font-mono">{rowIndex + 1}</td>
                    {headers.map(h => (
                      <td key={h} className="p-2">
                        <input
                          type="text"
                          value={formatValue(row[h as keyof RawContractData], h)}
                          onChange={(e) => handleCellChange(rowIndex, h as keyof RawContractData, e.target.value.replace(/,/g, ''))}
                          className="w-full bg-transparent p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-copper/30 rounded"
                        />
                      </td>
                    ))}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(rowIndex)} className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Edit">
                          <PenLine className="w-3 h-3 text-slate-500" />
                        </button>
                        <button onClick={() => handleDeleteRow(rowIndex)} className="p-1.5 hover:bg-red-100 rounded transition-colors" title="Delete">
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
};