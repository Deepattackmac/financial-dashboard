import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  TrendingUp,
  Home,
  Receipt,
  Sprout,
  Bell,
  Lightbulb,
  AlertCircle,
  PieChart,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgetTarget, setBudgetTarget] = useState(2500);
  const [targetInput, setTargetInput] = useState('2500');
  const [dashboardData, setDashboardData] = useState(null);

  // Pulls live data from your FastAPI backend when running
  useEffect(() => {
    fetch('https://financial-dashboard-i5z3.onrender.com')
      .then((res) => res.json())
      .then((data) => setDashboardData(data))
      .catch(() => console.log('Backend offline — displaying prototype data.'));
  }, []);

  const currentSpent = 3096.6;
  const overBudgetAmount = Math.max(0, currentSpent - budgetTarget).toFixed(2);
  const budgetPercent = Math.min(100, Math.round((currentSpent / budgetTarget) * 100));

  const lineData = {
    labels: [
      'Day 0', 'Oct 1', 'Oct 2', 'Oct 3', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8',
      'Oct 10', 'Oct 12', 'Oct 14', 'Oct 15', 'Oct 16', 'Oct 18', 'Oct 20', 'Oct 22', 'Oct 23', 'Oct 25'
    ],
    datasets: [
      {
        label: 'Account Balance',
        data: [5000, 8200, 6800, 6680, 6580, 6550, 6510, 6500, 6160, 6120, 5910, 6420, 6350, 6230, 5770, 5680, 5630, dashboardData?.current_balance || 5600],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5',
      },
      {
        label: 'Linear Regression Trend',
        data: [6750, 6690, 6630, 6570, 6510, 6450, 6390, 6330, 6270, 6210, 6150, 6090, 6030, 5970, 5910, 5850, 5790, 5700],
        borderColor: '#94a3b8',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 5000,
        max: 8500,
        ticks: { callback: (value) => `$${value}` },
        grid: { color: '#f1f5f9' },
      },
      x: { grid: { display: false } },
    },
  };

  const doughnutData = {
    labels: ['Housing', 'Food', 'Utilities', 'Transportation', 'Entertainment', 'Shopping'],
    datasets: [
      {
        data: [1400, 480, 180, 120, 450, 466.6],
        backgroundColor: ['#4f46e5', '#ec4899', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'],
        borderWidth: 0,
        cutout: '68%',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 28, padding: 14, color: '#475569' },
      },
    },
  };

  const handleSetBudget = () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) setBudgetTarget(val);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <TrendingUp className="text-indigo-400" size={26} />
            <div className="leading-tight">
              <div className="font-bold tracking-wide text-sm">FINANCIAL</div>
              <div className="font-bold tracking-wide text-sm text-indigo-400">TRACKING</div>
            </div>
          </div>

          <div className="px-4 pt-6">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Main Menu
            </p>
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Home size={19} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Receipt size={19} /> Transactions
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'income'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sprout size={19} /> Income & Assets
              </button>
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
            MC
          </div>
          <div className="text-sm font-medium text-slate-200">Michael Cabrera</div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Financial Tracking Dashboard</h1>
          <div className="relative cursor-pointer">
            <Bell className="text-slate-500" size={22} />
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {dashboardData?.anomalies_detected ?? 3}
            </span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Top Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="h-72">
                    <Line data={lineData} options={lineOptions} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                  <div className="h-64 w-full">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Budget Tracker & Spending Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800">Monthly Budget Tracker</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Target:</span>
                      <div className="flex items-center border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50">
                        <span className="text-slate-400 mr-1">$</span>
                        <input
                          type="number"
                          value={targetInput}
                          onChange={(e) => setTargetInput(e.target.value)}
                          className="w-20 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleSetBudget}
                        className="px-4 py-1.5 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Set
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">
                        Spent: <strong className="text-slate-800">${currentSpent.toFixed(2)}</strong>
                      </span>
                      <span className="font-semibold text-rose-500">{budgetPercent}% of Target</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          currentSpent > budgetTarget ? 'bg-rose-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="text-amber-400" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">Spending Insights</h2>
                  </div>

                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                    <p>
                      You have exceeded your target budget by{' '}
                      <strong className="text-slate-800">${overBudgetAmount}</strong>. Halt
                      discretionary spending.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <PieChart className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                    <p>
                      Your highest expense category is{' '}
                      <strong className="text-slate-800">Housing</strong> ($1,400.00).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Transactions</h2>
              <p className="text-slate-500 text-sm">Transaction history will populate here.</p>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Income & Assets</h2>
              <p className="text-slate-500 text-sm">Income sources and assets will populate here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}