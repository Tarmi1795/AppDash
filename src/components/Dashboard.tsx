import React, { useMemo, useState, useEffect } from 'react';
import { ProcessedContract } from '../types';
import { format, startOfMonth, subMonths } from 'date-fns';
import { motion } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LabelList
} from 'recharts';
import { TrendingUp, Users, FileText, ChevronDown, Maximize2, Minimize2, Search } from 'lucide-react';

interface DashboardProps {
  data: ProcessedContract[];
  onNavigate: (view: 'preview' | 'dashboard') => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-amber-200 shadow-xl p-4">
        <p className="font-mono text-[10px] text-amber-700 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-xl font-semibold text-slate-900">
          {formatCurrency(payload[0].value)} <span className="text-[10px] uppercase font-mono text-slate-500">QAR</span>
        </p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedContract, setSelectedContract] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [contractSearch, setContractSearch] = useState<string>('');
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
  const [startDateSearch, setStartDateSearch] = useState<string>('');
  const [endDateSearch, setEndDateSearch] = useState<string>('');
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [isContractsExpanded, setIsContractsExpanded] = useState(false);
  const [isClientsExpanded, setIsClientsExpanded] = useState(false);

  const clients = useMemo(() => {
    const c = new Set<string>();
    data.forEach(contract => {
      if (selectedDepartment !== 'All' && contract.department !== selectedDepartment) return;
      if (clientSearch && !contract.client.toLowerCase().includes(clientSearch.toLowerCase())) return;
      c.add(contract.client);
    });
    return ['All', ...Array.from(c).sort()];
  }, [data, selectedDepartment, clientSearch]);

  const contractOptions = useMemo(() => {
    const c = new Set<string>();
    data.forEach(contract => {
      if (selectedDepartment !== 'All' && contract.department !== selectedDepartment) return;
      if (selectedClient !== 'All' && contract.client !== selectedClient) return;
      if (contractSearch && !contract.contractNo.toLowerCase().includes(contractSearch.toLowerCase())) return;
      c.add(contract.contractNo);
    });
    return ['All', ...Array.from(c).sort()];
  }, [data, selectedClient, selectedDepartment, contractSearch]);

  const departments = useMemo(() => {
    const d = new Set<string>();
    data.forEach(contract => {
      if (deptSearch && !contract.department.toLowerCase().includes(deptSearch.toLowerCase())) return;
      d.add(contract.department);
    });
    return ['All', ...Array.from(d).sort()];
  }, [data, deptSearch]);

  useEffect(() => {
    if (selectedClient !== 'All' && !clients.includes(selectedClient)) {
      setSelectedClient('All');
    }
  }, [clients, selectedClient]);

  useEffect(() => {
    if (selectedContract !== 'All' && !contractOptions.includes(selectedContract)) {
      setSelectedContract('All');
    }
  }, [contractOptions, selectedContract]);

  const metrics = useMemo(() => {
    let totalContractValue = 0;
    let totalRemainingBalance = 0;
    const activeContracts = new Set<string>();

    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let contractValueInPeriod = 0;
      let remainingBalanceInPeriod = 0;
      let isActiveInPeriod = false;

      c.proratedMonths.forEach(pm => {
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);

        if (isInRange) {
          isActiveInPeriod = true;
          contractValueInPeriod += pm.value;
          if (pm.month >= startOfMonth(new Date())) {
            remainingBalanceInPeriod += pm.value;
          }
        }
      });

      if (isActiveInPeriod) {
        activeContracts.add(c.id);
        if (!start && !end) {
          totalContractValue += c.totalValue;
          totalRemainingBalance += c.remainingBalance;
        } else {
          totalContractValue += contractValueInPeriod;
          totalRemainingBalance += remainingBalanceInPeriod;
        }
      }
    });

    return { totalContractValue, totalRemainingBalance, activeContractsCount: activeContracts.size };
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment]);

  const monthlyTrendData = useMemo(() => {
    const trendMap = new Map<string, number>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      c.proratedMonths.forEach(pm => {
        const year = parseInt(format(pm.month, 'yyyy'));
        if (year < 2020) return;

        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);

        if (isInRange) {
          const key = viewType === 'monthly'
            ? format(pm.month, 'MMM yyyy')
            : format(pm.month, 'yyyy');
          trendMap.set(key, (trendMap.get(key) || 0) + pm.value);
        }
      });
    });
    const sortedKeys = Array.from(trendMap.keys()).sort((a, b) => {
      if (viewType === 'yearly') return parseInt(a) - parseInt(b);
      return new Date(a).getTime() - new Date(b).getTime();
    });
    return sortedKeys.map(key => ({ name: key, Revenue: trendMap.get(key) || 0 }));
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment, viewType]);

  const runningBalanceData = useMemo(() => {
    const timeMap = new Map<string, Date>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      c.proratedMonths.forEach(pm => {
        const year = parseInt(format(pm.month, 'yyyy'));
        if (year < 2020) return;

        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        if (isInRange) {
          const key = viewType === 'monthly'
            ? format(pm.month, 'yyyy-MM')
            : format(pm.month, 'yyyy');

          if (!timeMap.has(key) || pm.month > timeMap.get(key)!) {
            timeMap.set(key, pm.month);
          }
        }
      });
    });

    const sortedKeys = Array.from(timeMap.keys()).sort();

    return sortedKeys.map(key => {
      const targetDate = timeMap.get(key)!;
      let totalRemainingAtDate = 0;

      data.forEach(c => {
        if (selectedClient !== 'All' && c.client !== selectedClient) return;
        if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
        if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

        let recognizedUpToDate = 0;
        c.proratedMonths.forEach(pm => {
          if (pm.month <= targetDate) {
            recognizedUpToDate += pm.value;
          }
        });

        const balance = Math.max(0, c.totalValue - recognizedUpToDate);
        totalRemainingAtDate += balance;
      });

      return {
        name: viewType === 'monthly' ? format(targetDate, 'MMM yyyy') : format(targetDate, 'yyyy'),
        Balance: totalRemainingAtDate
      };
    });
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment, viewType]);

  const contractBalancesAsOf = useMemo(() => {
    const balances: { contract: ProcessedContract; balance: number }[] = [];
    const asOfDate = startDate ? startOfMonth(new Date(startDate)) : startOfMonth(new Date());

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let recognizedUpToDate = 0;
      c.proratedMonths.forEach(pm => {
        if (pm.month <= asOfDate) {
          recognizedUpToDate += pm.value;
        }
      });

      const balance = Math.max(0, c.totalValue - recognizedUpToDate);
      balances.push({ contract: c, balance });
    });

    return balances.sort((a, b) => b.balance - a.balance);
  }, [data, startDate, selectedClient, selectedContract, selectedDepartment]);

  const clientBalancesAsOf = useMemo(() => {
    const balances = new Map<string, number>();
    const asOfDate = startDate ? startOfMonth(new Date(startDate)) : startOfMonth(new Date());

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let recognizedUpToDate = 0;
      c.proratedMonths.forEach(pm => {
        if (pm.month <= asOfDate) {
          recognizedUpToDate += pm.value;
        }
      });

      const balance = Math.max(0, c.totalValue - recognizedUpToDate);
      balances.set(c.client, (balances.get(c.client) || 0) + balance);
    });

    return Array.from(balances.entries())
      .map(([client, balance]) => ({ client, balance }))
      .sort((a, b) => b.balance - a.balance);
  }, [data, startDate, selectedClient, selectedContract, selectedDepartment]);

  const availableMonths = useMemo(() => {
    const dates = new Set<string>();
    data.forEach(c => {
      c.proratedMonths.forEach(pm => dates.add(format(pm.month, 'yyyy-MM')));
    });
    return Array.from(dates).filter(d => parseInt(d.split('-')[0]) > 2019).sort();
  }, [data]);

  useEffect(() => {
    if (availableMonths.length > 0) {
      const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
      if (!startDate) {
        const initialStart = availableMonths.includes(lastMonth) ? lastMonth : availableMonths[0];
        setStartDate(initialStart);
      }
      if (!endDate) setEndDate(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, startDate, endDate]);

  const departmentMetrics = useMemo(() => {
    const deptMap = new Map<string, number>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let revenueInPeriod = 0;
      c.proratedMonths.forEach(pm => {
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        if (isInRange) revenueInPeriod += pm.value;
      });

      deptMap.set(c.department, (deptMap.get(c.department) || 0) + revenueInPeriod);
    });
    return deptMap;
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment]);

  return (
    <div className="min-h-screen text-slate-900 selection:bg-copper selection:text-obsidian overflow-x-hidden bg-[#fff5d9]">
      <div className="pt-4 pb-4 px-4 md:px-8">
        <div className="grid grid-cols-5 gap-4 items-end min-w-[900px]">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-widest text-slate-600">From</label>
            <div className="relative space-y-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search month..."
                  value={startDateSearch}
                  onChange={(e) => setStartDateSearch(e.target.value)}
                  onFocus={() => setActiveSearchField('startDate')}
                  onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-[10px] font-mono focus:ring-2 focus:ring-copper/30 focus:border-copper transition-colors placeholder:text-slate-400 text-slate-900"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />

                {activeSearchField === 'startDate' && startDateSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[60] max-h-40 overflow-y-auto">
                    {availableMonths.filter(m => {
                      const date = new Date(m);
                      const search = startDateSearch.toLowerCase();
                      return format(date, 'MMM yyyy').toLowerCase().includes(search) ||
                             format(date, 'MMMM yyyy').toLowerCase().includes(search);
                    }).slice(0, 5).map(m => (
                      <button
                        key={m}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                        onClick={() => {
                          setStartDate(m);
                          setStartDateSearch('');
                        }}
                      >
                        {format(new Date(m), 'MMM yyyy')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <select
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs font-sans font-medium focus:ring-2 focus:ring-copper/30 focus:border-copper cursor-pointer text-slate-900"
                >
                  <option value="" className="bg-white">Start</option>
                  {availableMonths.map(m => <option key={m} value={m} className="bg-white">{format(new Date(m), 'MMM yyyy')}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-copper pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-widest text-slate-600">To</label>
            <div className="relative space-y-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search month..."
                  value={endDateSearch}
                  onChange={(e) => setEndDateSearch(e.target.value)}
                  onFocus={() => setActiveSearchField('endDate')}
                  onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-[10px] font-mono focus:ring-2 focus:ring-copper/30 focus:border-copper transition-colors placeholder:text-slate-400 text-slate-900"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />

                {activeSearchField === 'endDate' && endDateSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[60] max-h-40 overflow-y-auto">
                    {availableMonths.filter(m => {
                      const date = new Date(m);
                      const search = endDateSearch.toLowerCase();
                      return format(date, 'MMM yyyy').toLowerCase().includes(search) ||
                             format(date, 'MMMM yyyy').toLowerCase().includes(search);
                    }).slice(0, 5).map(m => (
                      <button
                        key={m}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                        onClick={() => {
                          setEndDate(m);
                          setEndDateSearch('');
                        }}
                      >
                        {format(new Date(m), 'MMM yyyy')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <select
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs font-sans font-medium focus:ring-2 focus:ring-copper/30 focus:border-copper cursor-pointer text-slate-900"
                >
                  <option value="" className="bg-white">End</option>
                  {availableMonths.map(m => <option key={m} value={m} className="bg-white">{format(new Date(m), 'MMM yyyy')}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-copper pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-widest text-slate-600">Client</label>
            <div className="relative space-y-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search client..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onFocus={() => setActiveSearchField('client')}
                  onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-[10px] font-mono focus:ring-2 focus:ring-copper/30 focus:border-copper transition-colors placeholder:text-slate-400 text-slate-900"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />

                {activeSearchField === 'client' && clientSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[60] max-h-40 overflow-y-auto">
                    {clients.filter(c => c !== 'All').slice(0, 5).map(c => (
                      <button
                        key={c}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                        onClick={() => {
                          setSelectedClient(c);
                          setClientSearch('');
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs font-sans font-medium focus:ring-2 focus:ring-copper/30 focus:border-copper cursor-pointer text-slate-900"
                >
                  {clients.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-copper pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-widest text-slate-600">Contract</label>
            <div className="relative space-y-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contract..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  onFocus={() => setActiveSearchField('contract')}
                  onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-[10px] font-mono focus:ring-2 focus:ring-copper/30 focus:border-copper transition-colors placeholder:text-slate-400 text-slate-900"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />

                {activeSearchField === 'contract' && contractSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[60] max-h-40 overflow-y-auto">
                    {contractOptions.filter(c => c !== 'All').slice(0, 5).map(c => (
                      <button
                        key={c}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                        onClick={() => {
                          setSelectedContract(c);
                          setContractSearch('');
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs font-sans font-medium focus:ring-2 focus:ring-copper/30 focus:border-copper cursor-pointer text-slate-900"
                >
                  {contractOptions.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-copper pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-widest text-slate-600">Department</label>
            <div className="relative space-y-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dept..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  onFocus={() => setActiveSearchField('dept')}
                  onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-[10px] font-mono focus:ring-2 focus:ring-copper/30 focus:border-copper transition-colors placeholder:text-slate-400 text-slate-900"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />

                {activeSearchField === 'dept' && deptSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[60] max-h-40 overflow-y-auto">
                    {departments.filter(d => d !== 'All').slice(0, 5).map(d => (
                      <button
                        key={d}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                        onClick={() => {
                          setSelectedDepartment(d);
                          setDeptSearch('');
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 rounded-md px-3 py-2 text-xs font-sans font-medium focus:ring-2 focus:ring-copper/30 focus:border-copper cursor-pointer text-slate-900"
                >
                  {departments.map(d => <option key={d} value={d} className="bg-white">{d}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-copper pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-8 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Total Contract Value', value: metrics.totalContractValue, icon: FileText, suffix: 'QAR' },
            { label: 'Remaining Balance', value: metrics.totalRemainingBalance, icon: TrendingUp, suffix: 'QAR', highlight: true },
            { label: 'Active Contracts', value: metrics.activeContractsCount, icon: Users, suffix: 'Units' }
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 group relative"
            >
              <div className="laser-beam" style={{ animationDelay: `${i * 2}s` }} />
              <div className="refractive-highlight" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">{kpi.label}</span>
                  <kpi.icon className={`w-5 h-5 ${kpi.highlight ? 'text-copper' : 'text-slate-400'}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-3xl font-sans font-semibold tracking-tight ${kpi.highlight ? 'text-copper' : 'text-slate-900'}`}>
                    {typeof kpi.value === 'number' ? formatCurrency(kpi.value) : kpi.value}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">{kpi.suffix} // Verified</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-copper/40 to-transparent w-0 group-hover:w-full transition-all duration-700" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 flex flex-col min-h-[500px]"
          >
            <div className="laser-beam" style={{ animationDelay: '1s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif italic text-slate-900">Revenue Trajectory</h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Prorated Forecast // Aggregate</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewType('monthly')}
                    className={`w-10 h-10 border flex items-center justify-center text-[10px] font-mono transition-all ${viewType === 'monthly' ? 'bg-copper text-obsidian border-copper shadow-lg shadow-copper/20' : 'bg-white/60 backdrop-blur-sm border-white/50 text-slate-600 hover:bg-white/80'}`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setViewType('yearly')}
                    className={`w-10 h-10 border flex items-center justify-center text-[10px] font-mono transition-all ${viewType === 'yearly' ? 'bg-copper text-obsidian border-copper shadow-lg shadow-copper/20' : 'bg-white/60 backdrop-blur-sm border-white/50 text-slate-600 hover:bg-white/80'}`}
                  >
                    Y
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(0,0,0,0.2)"
                      tick={{fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono'}}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(0,0,0,0.2)"
                      tick={{fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono'}}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      axisLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#D97706', strokeWidth: 1 }} />
                    <Line
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#D97706"
                      strokeWidth={2}
                      dot={viewType === 'yearly'}
                      activeDot={{ r: 6, fill: '#D97706', strokeWidth: 0 }}
                    >
                      {viewType === 'yearly' && (
                        <LabelList
                          dataKey="Revenue"
                          position="top"
                          style={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                          formatter={(value: number) => `${(value / 1000000).toFixed(1)}M`}
                        />
                      )}
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 flex flex-col"
          >
            <div className="laser-beam" style={{ animationDelay: '2s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-sans font-semibold text-slate-900">Contract Running Balance</h3>
                </div>
                <button
                  onClick={() => setIsContractsExpanded(!isContractsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 border border-white/50 rounded-lg transition-all group"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 group-hover:text-copper">
                    {isContractsExpanded ? 'Collapse View' : 'Expand View'}
                  </span>
                  {isContractsExpanded ? <Minimize2 className="w-4 h-4 text-copper" /> : <Maximize2 className="w-4 h-4 text-copper" />}
                </button>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ${isContractsExpanded ? 'max-h-[2000px]' : 'max-h-[500px]'}`}>
                <div className="overflow-y-auto max-h-[500px] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                      <tr className="border-b border-slate-200">
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600 w-16">#</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600">Contract ID</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600">Client</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600 text-right">Total Value</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600 text-right">Balance As Of</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractBalancesAsOf
                        .slice(0, isContractsExpanded ? undefined : 10)
                        .map((item, idx) => (
                          <tr key={item.contract.id} className="border-b border-slate-100 hover:bg-white/50 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-slate-500">{idx + 1}</td>
                            <td className="p-4 font-mono text-xs text-slate-700">{item.contract.contractNo}</td>
                            <td className="p-4 font-sans text-sm text-slate-800">{item.contract.client}</td>
                            <td className="p-4 font-mono text-sm text-right text-slate-700">{formatCurrency(item.contract.totalValue)}</td>
                            <td className="p-4 font-mono text-sm text-right text-copper font-semibold">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!isContractsExpanded && contractBalancesAsOf.length > 10 && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setIsContractsExpanded(true)}
                      className="font-mono text-[10px] uppercase tracking-widest text-copper hover:text-amber-800 transition-colors"
                    >
                      View All {contractBalancesAsOf.length} Contracts
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 min-h-[450px] flex flex-col"
          >
            <div className="laser-beam" style={{ animationDelay: '3s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-sans font-semibold text-slate-900">Running Balance</h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Cumulative Portfolio Outstanding // Time Series</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewType('monthly')}
                    className={`w-10 h-10 border flex items-center justify-center text-[10px] font-mono transition-all ${viewType === 'monthly' ? 'bg-copper text-obsidian border-copper shadow-lg shadow-copper/20' : 'bg-white/60 backdrop-blur-sm border-white/50 text-slate-600 hover:bg-white/80'}`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setViewType('yearly')}
                    className={`w-10 h-10 border flex items-center justify-center text-[10px] font-mono transition-all ${viewType === 'yearly' ? 'bg-copper text-obsidian border-copper shadow-lg shadow-copper/20' : 'bg-white/60 backdrop-blur-sm border-white/50 text-slate-600 hover:bg-white/80'}`}
                  >
                    Y
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] overflow-x-auto">
                <div style={{
                  minWidth: viewType === 'monthly' ? Math.max(800, runningBalanceData.length * 60) : '100%',
                  height: '100%',
                  minHeight: '350px'
                }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={runningBalanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(0,0,0,0.2)"
                        tick={{fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono'}}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="rgba(0,0,0,0.2)"
                        tick={{fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono'}}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        axisLine={false}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#D97706', strokeWidth: 1 }} />
                      <Line
                        type="monotone"
                        dataKey="Balance"
                        stroke="#D97706"
                        strokeWidth={2}
                        dot={viewType === 'yearly'}
                        activeDot={{ r: 6, fill: '#D97706', strokeWidth: 0 }}
                      >
                        {viewType === 'yearly' && (
                          <LabelList
                            dataKey="Balance"
                            position="top"
                            style={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                            formatter={(value: number) => `${(value / 1000000).toFixed(1)}M`}
                          />
                        )}
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 flex flex-col"
          >
            <div className="laser-beam" style={{ animationDelay: '4s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-sans font-semibold text-slate-900">Client Balances</h3>
                </div>
                <button
                  onClick={() => setIsClientsExpanded(!isClientsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 border border-white/50 rounded-lg transition-all group"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 group-hover:text-copper">
                    {isClientsExpanded ? 'Collapse View' : 'Expand View'}
                  </span>
                  {isClientsExpanded ? <Minimize2 className="w-4 h-4 text-copper" /> : <Maximize2 className="w-4 h-4 text-copper" />}
                </button>
              </div>

              <div className="mb-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientBalancesAsOf.filter(item => item.balance > 0).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                    <XAxis
                      dataKey="client"
                      stroke="rgba(0,0,0,0.2)"
                      tick={{fill: '#6b7280', fontSize: 8, fontFamily: 'JetBrains Mono'}}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(0,0,0,0.2)"
                      tick={{fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono'}}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      axisLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="balance" fill="#D97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ${isClientsExpanded ? 'max-h-[2000px]' : 'max-h-[500px]'}`}>
                <div className="overflow-y-auto max-h-[500px] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                      <tr className="border-b border-slate-200">
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600 w-16">#</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600">Client Entity</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-slate-600 text-right">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientBalancesAsOf
                        .filter(item => item.balance > 0)
                        .slice(0, isClientsExpanded ? undefined : 10)
                        .map((item, i) => (
                          <tr key={item.client} className="border-b border-slate-100 hover:bg-white/50 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-slate-500">{i + 1}</td>
                            <td className="p-4 font-sans text-sm text-slate-800">{item.client}</td>
                            <td className="p-4 font-mono text-sm text-right text-copper font-semibold">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!isClientsExpanded && clientBalancesAsOf.filter(item => item.balance > 0).length > 10 && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setIsClientsExpanded(true)}
                      className="font-mono text-[10px] uppercase tracking-widest text-copper hover:text-amber-800 transition-colors"
                    >
                      View All {clientBalancesAsOf.filter(item => item.balance > 0).length} Clients
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 min-h-[300px] flex flex-col"
          >
            <div className="laser-beam" style={{ animationDelay: '5s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10">
              <h3 className="text-xl font-sans font-semibold mb-8 text-slate-900">Department Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['VSS', 'TSS', 'NDT', 'TPI'].map((dept, i) => (
                  <motion.div
                    key={dept}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl transition-all glass-card-inner relative overflow-hidden"
                  >
                    <div className="laser-beam opacity-20" style={{ animationDelay: `${i * 0.5}s`, animationDuration: '4s' }} />
                    <div className="refractive-highlight opacity-10" />
                    <div className="relative z-10">
                      <p className="font-mono text-[10px] uppercase mb-2 text-slate-500">{dept}</p>
                      <p className="text-2xl font-sans font-semibold text-slate-900">
                        {formatCurrency(departmentMetrics.get(dept) || 0)} <span className="text-xs font-normal text-slate-500">QAR</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <footer className="border-t border-amber-200 py-12 px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <p className="font-serif italic text-2xl text-slate-800">Financial Core Intelligence</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-slate-500">Precision Forecasting Protocol // © 2026</p>
          </div>
          <div className="flex gap-12 font-mono text-[9px] uppercase tracking-widest text-slate-500">
            <div className="space-y-1">
              <p className="text-copper">Location</p>
              <p className="text-slate-700">Doha // Qatar</p>
            </div>
            <div className="space-y-1">
              <p className="text-copper">Encryption</p>
              <p className="text-slate-700">AES-256 // Active</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};