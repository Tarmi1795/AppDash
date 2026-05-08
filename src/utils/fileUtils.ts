import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { format, parse, isValid } from 'date-fns';
import { RawContractData } from '../types';

const DATE_COLUMNS = [
  'Signing Date (per contract)-dd/mm/yyy',
  'Start Date (per contract)-dd/mm/yyy',
  'Est. Completion Date-dd/mm/yyy'
];

const parseExcelDate = (value: any): string | null => {
  if (!value) return null;

  // If it's already a Date object (from xlsx with cellDates: true)
  if (value instanceof Date && isValid(value)) {
    return format(value, 'yyyy-MM-dd');
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd');
    }
  }

  const str = String(value).trim();
  if (!str) return null;

  // Handle dd/mm/yyyy or d/m/yyyy format
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd');
    }
  }

  // Handle mm/dd/yyyy format (US style)
  const mmddyyyy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd');
    }
  }

  // Try native Date parsing
  const nativeDate = new Date(str);
  if (isValid(nativeDate)) {
    return format(nativeDate, 'yyyy-MM-dd');
  }

  return null;
};

const cleanDhareebaNo = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Remove .00 suffix if present (Excel numeric formatting)
  return str.replace(/\.00$/, '');
};

export const normalizeRawData = (data: RawContractData[]): RawContractData[] => {
  return data.map(row => {
    const normalized = { ...row };

    // Parse and normalize dates to YYYY-MM-DD
    for (const dateCol of DATE_COLUMNS) {
      if (normalized[dateCol] !== undefined && normalized[dateCol] !== '') {
        const parsed = parseExcelDate(normalized[dateCol]);
        if (parsed) {
          normalized[dateCol] = parsed;
        }
      }
    }

    // Clean Dhareeba No. - remove decimal suffix
    if (normalized[' Dhareeba No. '] !== undefined) {
      normalized[' Dhareeba No. '] = cleanDhareebaNo(normalized[' Dhareeba No. ']);
    }

    return normalized;
  });
};

export const parseCSV = (file: File): Promise<RawContractData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<RawContractData>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const normalized = normalizeRawData(results.data);
        resolve(normalized);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const parseExcel = (file: File): Promise<RawContractData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<RawContractData>(worksheet, {
          defval: '',
        });
        const normalized = normalizeRawData(jsonData);
        resolve(normalized);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const parseFile = async (file: File): Promise<RawContractData[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }
};

export const generateTemplate = () => {
  const headers = [
    'Serial No.',
    'Customer Name',
    'CONTRACT NO.',
    'WBS',
    ' Dhareeba No. ',
    'Billing Currency (short name)',
    'Project Country Location',
    'Signing Date (per contract)-dd/mm/yyy',
    'Start Date (per contract)-dd/mm/yyy',
    'Est. Completion Date-dd/mm/yyy',
    'Total Contract Revenue Value *1000 (Est.)',
    'Contract Value QAR',
    'Remarks',
    'DEPARTMENT',
    'Comparison remarks (local vs. Dhareeba)'
  ];
  const csvContent = headers.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'financial_contract_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};