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
  Upload,
  Plus,
  AlertTriangle,
  CheckCircle2,
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

const API_URL = 'https://financial-dashboard-i5z3.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgetTarget, setBudgetTarget] = useState(2500);
  const [targetInput, setTargetInput] = useState('2500');
  const [data, setData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Form states
  const [txForm, setTxForm] = useState({
    date: '2026-10-28',
    description: '',
    category: 'Food',
    amount: '',
  });
  const [incomeForm, setIncomeForm] = useState({
    name: '',
    type: 'Income',
    amount: '',
  });

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard-summary`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => console.log('Backend waking up or offline.'));
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.description || !txForm.amount) return;

    const res = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txForm, amount: parseFloat(txForm.amount) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(updated);
      setTxForm({ ...txForm, description: '', amount: '' });
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.name || !incomeForm.amount) return;

    const res = await fetch(`${API_URL}/api/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...incomeForm, amount: parseFloat(incomeForm.amount) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(updated);
      setIncomeForm({ name: '', type: 'Income', amount: '' });
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadStatus('Uploading & running ML models...');

    try {
      const res = await fetch(`${API_URL}/api/upload-csv`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setUploadStatus('CSV loaded! Charts and ML models updated.');
      } else {
        const err = await res.json();
        setUploadStatus(`Error: ${err.detail}`);
      }
    } catch {
      setUploadStatus('Upload failed. Make sure the backend is awake.');
    }
  };

  const currentSpent = data?.total_spent ?? 3096.6;
  const overBudgetAmount = Math.max(0, currentSpent - budgetTarget).toFixed(2);
  const budgetPercent = Math.min(100, Math.round((currentSpent / budgetTarget) * 100));

  const lineData = {
    labels: data?.balance_history?.labels ?? ['Start', 'Oct 1', 'Oct 10', 'Oct 25'],
    datasets: [
      {
        label: 'Account Balance',
        data: data?.balance_history?.values ?? [8700, 7300, 6200, 5603.4],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5',
      },
      {
        label: 'Linear Regression Trend',
        data: data?.balance_history?.trend ?? [8400, 7400, 6400, 5500],
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
        ticks: { callback: (value) => `$${value}` },
        grid: { color: '#f1f5f9' },
      },
      x: { grid: { display: false } },
    },
  };

  const categoryLabels = data?.category_breakdown
    ? Object.keys(data.category_breakdown)
    : ['Housing', 'Food', 'Utilities', 'Transportation', 'Entertainment', 'Shopping'];
  const categoryValues = data?.category_breakdown
    ? Object.values(data.category_breakdown)
    : [1400, 480, 180, 120, 450, 466.6];

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
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
        labels: { boxWidth: 24, padding: 12, color: '#475569' },
      },
    },
  };

  const handleSetBudget = () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) setBudgetTarget(val);
  };

  const totalIncome = (data?.income_assets ?? [])
    .filter((i) => i.type === 'Income')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalAssets = (data?.income_assets ?? [])
    .filter((i) => i.type === 'Asset')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col justify-between shrink-0">
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

        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
            MC
          </div>
          <div className="text-sm font-medium text-slate-200">Michael Cabrera</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-800">Financial Tracking Dashboard</h1>
          <div className="flex items-center gap-5">
            {data && (
              <span className="text-sm text-slate-500">
                EOM Forecast:{' '}
                <strong className="text-indigo-600">${data.eom_forecast.toLocaleString()}</strong>
              </span>
            )}
            <div className="relative cursor-pointer" onClick={() => setActiveTab('transactions')}>
              <Bell className="text-slate-500" size={22} />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {data?.anomalies_detected ?? 0}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6">
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
                        className="px-4 py-1.5 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-lg hover:bg-indigo-100"
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
                      <span
                        className={`font-semibold ${
                          currentSpent > budgetTarget ? 'text-rose-500' : 'text-indigo-600'
                        }`}
                      >
                        {budgetPercent}% of Target
                      </span>
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
                      {currentSpent > budgetTarget ? (
                        <>
                          You have exceeded your target budget by{' '}
                          <strong className="text-slate-800">${overBudgetAmount}</strong>. Halt
                          discretionary spending.
                        </>
                      ) : (
                        <>You are currently within your monthly budget target.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <PieChart className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                    <p>
                      Your highest expense category is{' '}
                      <strong className="text-slate-800">
                        {data?.highest_category?.name ?? 'Housing'}
                      </strong>{' '}
                      (${(data?.highest_category?.amount ?? 1400).toFixed(2)}).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Add Transaction & CSV Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form
                  onSubmit={handleAddTransaction}
                  className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4"
                >
                  <h2 className="text-lg font-bold text-slate-800">Add Transaction</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="date"
                      value={txForm.date}
                      onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={txForm.description}
                      onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                    <select
                      value={txForm.category}
                      onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option>Housing</option>
                      <option>Food</option>
                      <option>Utilities</option>
                      <option>Transportation</option>
                      <option>Entertainment</option>
                      <option>Shopping</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount ($)"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={16} /> Add Transaction
                  </button>
                </form>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Upload Bank CSV</h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Columns required: <code>date, description, category, amount</code>
                    </p>
                  </div>
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-semibold text-sm cursor-pointer hover:bg-indigo-50">
                    <Upload size={18} /> Choose CSV File
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                  {uploadStatus && (
                    <p className="text-xs text-slate-600 mt-2 font-medium">{uploadStatus}</p>
                  )}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">Date</th>
                      <th className="py-3.5 px-6 font-semibold">Description</th>
                      <th className="py-3.5 px-6 font-semibold">Category</th>
                      <th className="py-3.5 px-6 font-semibold">Amount</th>
                      <th className="py-3.5 px-6 font-semibold">AI Risk Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.transactions ?? []).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 text-slate-500">{tx.date}</td>
                        <td className="py-3.5 px-6 font-medium text-slate-800">{tx.description}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-6">
                          {tx.risk_flag ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-semibold">
                              <AlertTriangle size={13} /> Overspending Risk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                              <CheckCircle2 size={13} /> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INCOME & ASSETS TAB */}
          {activeTab === 'income' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Total Monthly Income</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Total Assets</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">
                    ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleAddIncome}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center"
              >
                <input
                  type="text"
                  placeholder="Source / Asset Name"
                  value={incomeForm.name}
                  onChange={(e) => setIncomeForm({ ...incomeForm, name: e.target.value })}
                  className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <select
                  value={incomeForm.type}
                  onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value })}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Income">Income</option>
                  <option value="Asset">Asset</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount ($)"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  className="w-36 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={16} /> Add Entry
                </button>
              </form>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">Name</th>
                      <th className="py-3.5 px-6 font-semibold">Type</th>
                      <th className="py-3.5 px-6 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.income_assets ?? []).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 font-medium text-slate-800">{item.name}</td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                              item.type === 'Income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}