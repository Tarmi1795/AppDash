/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Previewer } from './components/Previewer';
import { TopNav } from './components/TopNav';
import { RecordManagement } from './components/RecordManagement';
import { processContractData } from './utils/dataParser';
import { ProcessedContract, RawContractData } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { bulkSaveEntries, fetchAllEntries } from './utils/supabase';

export default function App() {
  const [rawData, setRawData] = useState<RawContractData[] | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContract[] | null>(null);
  const [activeView, setActiveView] = useState<'entry' | 'preview' | 'dashboard' | 'records'>('entry');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        const entries = await fetchAllEntries();
        if (entries && entries.length > 0) {
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
          })) as RawContractData[];

          setRawData(formattedData);
          setProcessedData(processContractData(formattedData));
          setActiveView('dashboard');
        }
      } catch (error) {
        console.error('Failed to load from database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const handleDataLoaded = (data: RawContractData[]) => {
    setRawData(data);
    setActiveView('preview');
  };

  const handleConfirm = async (updatedData: RawContractData[]) => {
    await bulkSaveEntries(updatedData);
    setRawData(updatedData);
    setProcessedData(processContractData(updatedData));
    setActiveView('dashboard');
  };

  const handleCancel = () => {
    setRawData(null);
    setActiveView('entry');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <TopNav activeView={activeView} onNavigate={setActiveView} />

        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-2 border-copper border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeView === 'entry' ? (
          <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
            <Previewer onDataLoaded={handleDataLoaded} />
          </div>
        ) : activeView === 'preview' && rawData ? (
          <Previewer
            data={rawData}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ) : activeView === 'records' ? (
          <RecordManagement />
        ) : (
          processedData && <Dashboard data={processedData} onNavigate={setActiveView} />
        )}
      </div>
    </ThemeProvider>
  );
}
