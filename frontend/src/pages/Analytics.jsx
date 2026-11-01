import { useEffect, useState, useMemo, useCallback } from 'react';
import { Download, Printer, Calendar, BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Sparkles } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api, download } from '../api.js';
import { fmtMoney, monthLabel } from '../lib/format.js';
import { PageHead, EmptyState, SkeletonCards } from '../components/ui.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const DATE_RANGES = ['This Month', 'Last 3 Months', 'Last 6 Months', 'All Time'];

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10, 6, 20, 0.95)',
      borderColor: 'rgba(168, 85, 247, 0.3)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#d4d0e0',
      padding: 12,
      cornerRadius: 10,
      titleFont: { family: 'Plus Jakarta Sans, sans-serif', weight: 600 },
      bodyFont: { family: 'Plus Jakarta Sans, sans-serif' },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(168, 85, 247, 0.08)' },
      ticks: { color: '#a393be', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11, weight: '500' } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(168, 85, 247, 0.08)' },
      ticks: { color: '#a393be', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 } },
      border: { display: false },
    },
  },
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10, 6, 20, 0.95)',
      borderColor: 'rgba(168, 85, 247, 0.3)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#d4d0e0',
      padding: 12,
      cornerRadius: 10,
      titleFont: { family: 'Plus Jakarta Sans, sans-serif', weight: 600 },
      bodyFont: { family: 'Plus Jakarta Sans, sans-serif' },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(168, 85, 247, 0.08)' },
      ticks: { color: '#a393be', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11, weight: '500' } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(168, 85, 247, 0.08)' },
      ticks: { color: '#a393be', font: { family: 'Plus Jakarta Sans, sans-serif', size: 11 } },
      border: { display: false },
    },
  },
  interaction: { intersect: false, mode: 'index' },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10, 6, 20, 0.95)',
      borderColor: 'rgba(168, 85, 247, 0.3)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#d4d0e0',
      padding: 12,
      cornerRadius: 10,
      titleFont: { family: 'Plus Jakarta Sans, sans-serif', weight: 600 },
      bodyFont: { family: 'Plus Jakarta Sans, sans-serif' },
    },
  },
};

const DOUGHNUT_COLORS = ['#d946ef', '#a855f7', '#06b6d4', '#fbbf24', '#ec4899', '#38bdf8', '#10b981'];

function buildBarData(labels, incomeData, expenseData) {
  return {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: '#06b6d4',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Expense',
        data: expenseData,
        backgroundColor: '#d946ef',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
}

function filterByRange(arr, range, dateKey) {
  if (range === 'All Time') return arr;
  const now = new Date();
  let cutoff;
  if (range === 'This Month') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'Last 3 Months') {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else if (range === 'Last 6 Months') {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }
  return arr.filter((item) => {
    const val = item[dateKey];
    if (!val) return true;
    return new Date(val) >= cutoff;
  });
}

export function Analytics() {
  const [periods, setPeriods] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('All Time');

  useEffect(() => {
    async function load() {
      try {
        const [p, s] = await Promise.all([api.periods(), api.stats()]);
        setPeriods(p);
        setStats(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.exportCsv();
      await download(res, 'spendwise-analytics-export.csv');
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const daily = useMemo(() => filterByRange(periods?.daily || [], dateRange, 'date'), [periods, dateRange]);
  const weekly = useMemo(() => filterByRange(periods?.weekly || [], dateRange, 'week'), [periods, dateRange]);
  const monthly = useMemo(() => filterByRange(periods?.monthly || [], dateRange, 'month'), [periods, dateRange]);
  const yearly = periods?.yearly || [];

  const catEntries = Object.entries(stats?.byCategory || {}).sort((a, b) => b[1] - a[1]);

  const dailyAvg = daily.length ? daily.reduce((a, d) => a + d.expenses, 0) / daily.length : 0;
  const weeklyAvg = weekly.length ? weekly.reduce((a, w) => a + w.expenses, 0) / weekly.length : 0;
  const monthlyAvg = monthly.length ? monthly.reduce((a, m) => a + m.expenses, 0) / monthly.length : 0;

  const lineChartData = useMemo(() => ({
    labels: monthly.map((m) => monthLabel(m.month)),
    datasets: [
      {
        label: 'Expenses',
        data: monthly.map((m) => m.expenses),
        borderColor: '#d946ef',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(217, 70, 239, 0.15)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(217, 70, 239, 0.35)');
          gradient.addColorStop(1, 'rgba(217, 70, 239, 0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#d946ef',
        pointBorderColor: '#d946ef',
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: 'Income',
        data: monthly.map((m) => m.income),
        borderColor: '#06b6d4',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#06b6d4',
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
    ],
  }), [monthly]);

  const doughnutData = useMemo(() => ({
    labels: catEntries.map(([cat]) => cat),
    datasets: [
      {
        data: catEntries.map(([, amt]) => amt),
        backgroundColor: catEntries.map((_, i) => DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [catEntries]);

  if (loading) return <SkeletonCards n={4} />;

  if (!stats || stats.count === 0) {
    return (
      <div>
        <PageHead title="Financial Analytics" sub="Deep-dive into income vs expense distributions" />
        <div className="glass-card-neon">
          <EmptyState
            icon={<BarChart3 size={48} />}
            title="Insufficient telemetry to analyze"
            sub="Record at least a few expenses and income entries to generate analytics charts."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Financial Analytics & Velocity"
        sub="Longitudinal cashflow trends, run rates, and merchant concentrations"
        right={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-neon btn-neon-secondary" onClick={() => window.print()}>
              <Printer size={15} /> <span>Print Report</span>
            </button>
            <button className="btn-neon btn-neon-secondary" onClick={handleExportCsv} disabled={exporting}>
              <Download size={15} /> <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        }
      />

      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 24,
        padding: 4,
        background: 'rgba(168, 85, 247, 0.06)',
        borderRadius: 12,
        border: '1px solid rgba(168, 85, 247, 0.12)',
        width: 'fit-content',
      }}>
        {DATE_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              transition: 'all 0.2s ease',
              background: dateRange === range
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(217, 70, 239, 0.25))'
                : 'transparent',
              color: dateRange === range ? '#fff' : '#a393be',
              boxShadow: dateRange === range ? '0 0 12px rgba(168, 85, 247, 0.2)' : 'none',
            }}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Average Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Daily Burn Rate</span>
            <div className="icon-tile-gradient icon-tile-magenta">
              <Calendar size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: 'var(--neon-magenta)' }}>
            {fmtMoney(dailyAvg)}
          </div>
          <div className="metric-card-footer">
            <span>14-day trailing average</span>
          </div>
        </div>

        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Weekly Outflow</span>
            <div className="icon-tile-gradient icon-tile-purple">
              <Calendar size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: '#fff' }}>
            {fmtMoney(weeklyAvg)}
          </div>
          <div className="metric-card-footer">
            <span>8-week rolling mean</span>
          </div>
        </div>

        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Monthly Burn</span>
            <div className="icon-tile-gradient icon-tile-cyan">
              <Calendar size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: 'var(--neon-cyan)' }}>
            {fmtMoney(monthlyAvg)}
          </div>
          <div className="metric-card-footer">
            <span>12-month average expense</span>
          </div>
        </div>

        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Net Savings Rate</span>
            <div className="icon-tile-gradient icon-tile-gold">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: 'var(--neon-gold)' }}>
            {stats.savingsRate}%
          </div>
          <div className="metric-card-footer">
            <span>Cumulative efficiency</span>
          </div>
        </div>
      </div>

      {/* Daily Cash Flow & Weekly Cash Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 22, marginBottom: 24 }}>
        <div className="glass-card-neon">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="icon-tile-gradient icon-tile-cyan">
                <Activity size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Daily Velocity (Last 14 Days)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Daily inflow vs outflow volume</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>■ Inflow</span>
              <span style={{ color: 'var(--neon-magenta)', fontWeight: 700 }}>■ Outflow</span>
            </div>
          </div>
          <div style={{ height: 260, position: 'relative' }}>
            <Bar
              data={buildBarData(
                daily.map((d) => d.date.slice(5)),
                daily.map((d) => d.income),
                daily.map((d) => d.expenses)
              )}
              options={barChartOptions}
            />
          </div>
        </div>

        <div className="glass-card-neon">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="icon-tile-gradient icon-tile-purple">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Weekly Performance (Last 8 Weeks)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Weekly income vs expense performance</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>■ Inflow</span>
              <span style={{ color: 'var(--neon-magenta)', fontWeight: 700 }}>■ Outflow</span>
            </div>
          </div>
          <div style={{ height: 260, position: 'relative' }}>
            <Bar
              data={buildBarData(
                weekly.map((w) => w.week.slice(-5)),
                weekly.map((w) => w.income),
                weekly.map((w) => w.expenses)
              )}
              options={barChartOptions}
            />
          </div>
        </div>
      </div>

      {/* Monthly Trends & Category Proportion */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 22, marginBottom: 24 }}>
        <div className="glass-card-neon">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="icon-tile-gradient icon-tile-cyan">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>12-Month Longitudinal Trend</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Historical monthly capital evolution</p>
            </div>
          </div>
          <div style={{ height: 260, position: 'relative' }}>
            <Bar
              data={buildBarData(
                monthly.map((m) => monthLabel(m.month)),
                monthly.map((m) => m.income),
                monthly.map((m) => m.expenses)
              )}
              options={barChartOptions}
            />
          </div>
        </div>

        <div className="glass-card-neon" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="icon-tile-gradient icon-tile-magenta">
              <PieChart size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Category Outflow Breakdown</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Detailed breakdown of total expenses</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 180, height: 180, flexShrink: 0 }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div style={{ flex: 1, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catEntries.map(([category, amt], i) => {
                const pct = stats.expenses > 0 ? ((amt / stats.expenses) * 100).toFixed(1) : 0;
                return (
                  <div key={category} className="legend-pill" style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length],
                          boxShadow: `0 0 8px ${DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]}`,
                        }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5 }}>{category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</span>
                      <span className="font-numeric" style={{ fontWeight: 700, color: '#fff', fontSize: 12.5 }}>
                        {fmtMoney(amt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Spending Trend */}
      <div className="glass-card-neon" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="icon-tile-gradient icon-tile-magenta">
              <TrendingDown size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Spending Trend</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Monthly expense area vs income overlay</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
            <span style={{ color: '#d946ef', fontWeight: 700 }}>■ Expenses</span>
            <span style={{ color: '#06b6d4', fontWeight: 700 }}>■ Income</span>
          </div>
        </div>
        <div style={{ height: 280, position: 'relative' }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Top Merchants / Frequent Payees */}
      <div className="glass-card-neon" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="icon-tile-gradient icon-tile-purple">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Top Counterparties & Payees</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Most frequent transaction counterparties</p>
          </div>
        </div>

        {stats.topMerchants?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {stats.topMerchants.map((m, i) => (
              <div
                key={i}
                className="legend-pill"
                style={{
                  padding: '12px 16px',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13.5, color: '#fff' }}>{m.title}</span>
                <span className="pill pill-income" style={{ fontSize: 11 }}>{m.count} txns</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No merchant frequency data yet.</p>
        )}
      </div>
    </div>
  );
}
