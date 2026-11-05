import { useEffect, useState, useMemo } from 'react';
import { FolderTree, TrendingDown, DollarSign, Target, PieChart, Plus, Search, Layers, ShoppingBag, Utensils, Car, Zap, HeartPulse, Film, Plane, Briefcase, Gift, ShieldAlert } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { api } from '../api.js';
import { fmtMoney, todayYM, monthLabel } from '../lib/format.js';
import { PageHead, EmptyState, SkeletonCards, Progress } from '../components/ui.jsx';

ChartJS.register(ArcElement, Tooltip, Legend);

const CAT_ICONS = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Zap,
  Health: HeartPulse,
  Entertainment: Film,
  Travel: Plane,
  Salary: DollarSign,
  Freelance: Briefcase,
  Investment: TrendingDown,
  Gift: Gift,
  Other: Layers,
};

const CAT_COLORS = [
  '#d946ef', '#a855f7', '#06b6d4', '#fbbf24', '#ec4899',
  '#38bdf8', '#10b981', '#f43f5e', '#6366f1', '#14b8a6', '#eab308', '#64748b'
];

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, width, height } = chart;
    const total = chart.config.options.plugins.centerText?.total;
    if (total == null) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px Space Grotesk, sans-serif';
    ctx.fillText(fmtMoney(total), width / 2, height / 2 - 6);

    ctx.fillStyle = '#a393be';
    ctx.font = '500 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Total Outflow', width / 2, height / 2 + 14);

    ctx.restore();
  },
};

export function Categories() {
  const [stats, setStats] = useState(null);
  const [budgets, setBudgets] = useState(null);
  const [meta, setMeta] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, b, m] = await Promise.all([
          api.stats(),
          api.budgetStatus(todayYM()),
          api.meta(),
        ]);
        setStats(s);
        setBudgets(b);
        setMeta(m);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const catMap = stats?.byCategory || {};
  const allCatKeys = useMemo(() => {
    const fromMeta = meta.categories || [];
    const fromStats = Object.keys(catMap);
    return Array.from(new Set([...fromMeta, ...fromStats]));
  }, [meta.categories, catMap]);

  const totalExpense = stats?.expenses || 0;

  const filtered = allCatKeys.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const chartCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  if (loading) return <SkeletonCards n={4} />;

  const donutData = {
    labels: chartCategories.map((c) => c[0]),
    datasets: [
      {
        data: chartCategories.map((c) => c[1]),
        backgroundColor: chartCategories.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions = {
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
        titleFont: { family: 'Plus Jakarta Sans, sans-serif', weight: '600' },
        bodyFont: { family: 'Plus Jakarta Sans, sans-serif' },
        callbacks: {
          label(ctx) {
            return ` ${fmtMoney(ctx.parsed)}`;
          },
        },
      },
      centerText: { total: totalExpense },
    },
  };

  return (
    <div>
      <PageHead
        title="Category Intelligence & Outflow"
        sub="Category-level expense distributions, trends, and budget tracking"
        right={
          <div className="search-neon" style={{ maxWidth: 280 }}>
            <Search size={15} />
            <input
              type="search"
              placeholder="Filter categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Tracked Categories</span>
            <div className="icon-tile-gradient icon-tile-purple">
              <FolderTree size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: '#fff' }}>
            {allCatKeys.length}
          </div>
          <div className="metric-card-footer">
            <span>Standard & custom</span>
          </div>
        </div>

        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Top Category</span>
            <div className="icon-tile-gradient icon-tile-magenta">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: 'var(--neon-magenta)' }}>
            {chartCategories[0] ? chartCategories[0][0] : 'None'}
          </div>
          <div className="metric-card-footer">
            <span>{chartCategories[0] ? fmtMoney(chartCategories[0][1]) : 'No expenses'}</span>
          </div>
        </div>

        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Total Categorized</span>
            <div className="icon-tile-gradient icon-tile-cyan">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: 'var(--neon-cyan)' }}>
            {fmtMoney(totalExpense)}
          </div>
          <div className="metric-card-footer">
            <span>All expense records</span>
          </div>
        </div>

        <div className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="metric-card-header">
            <span className="metric-card-label">Active Category Budgets</span>
            <div className="icon-tile-gradient icon-tile-gold">
              <Target size={18} />
            </div>
          </div>
          <div className="metric-card-value font-numeric" style={{ color: 'var(--neon-gold)' }}>
            {budgets?.status?.length || 0}
          </div>
          <div className="metric-card-footer">
            <span>For {monthLabel(todayYM())}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 22, marginBottom: 24 }}>
        {/* Category Donut Visualization */}
        <div className="glass-card-neon">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="icon-tile-gradient icon-tile-magenta">
              <PieChart size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Expense Breakdown by Category</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Proportional volume of your total spending</p>
            </div>
          </div>
          <div style={{ height: 280, position: 'relative' }}>
            <Doughnut data={donutData} options={donutOptions} plugins={[centerTextPlugin]} />
          </div>
        </div>

        {/* Top Categories Distribution List */}
        <div className="glass-card-neon" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="icon-tile-gradient icon-tile-cyan">
              <TrendingDown size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Spending Share Ranking</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Ranked by total historical outflow</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {chartCategories.length === 0 ? (
              <EmptyState title="No expense data" sub="Add transactions to view category ranking" />
            ) : (
              chartCategories.map(([category, spent], idx) => {
                const pct = totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0;
                const Icon = CAT_ICONS[category] || Layers;
                const col = CAT_COLORS[idx % CAT_COLORS.length];
                return (
                  <div key={category} className="legend-pill" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: col }}>
                        <Icon size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
                      <span className="font-numeric" style={{ fontWeight: 700, color: '#fff', fontSize: 13.5 }}>
                        {fmtMoney(spent)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '24px 0 16px', color: '#fff', letterSpacing: '-0.02em' }}>
        All Categories ({filtered.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((category, idx) => {
          const spent = catMap[category] || 0;
          const pct = totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0;
          const budget = budgets?.status?.find((b) => b.category === category);
          const Icon = CAT_ICONS[category] || Layers;
          const color = CAT_COLORS[idx % CAT_COLORS.length];

          return (
            <div key={category} className="glass-card-neon" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{category}</h4>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{pct}% of total</span>
                  </div>
                </div>
                <span className="font-numeric" style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{fmtMoney(spent)}</span>
              </div>

              {budget ? (
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(168, 85, 247, 0.16)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Budget ({budget.pct}% consumed)</span>
                    <span className="font-numeric" style={{ fontWeight: 600, color: '#fff' }}>{fmtMoney(budget.spent)} / {fmtMoney(budget.limit)}</span>
                  </div>
                  <Progress pct={budget.pct} state={budget.state} />
                </div>
              ) : (
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(168, 85, 247, 0.16)', fontSize: 11.5, color: 'var(--text-dim)' }}>
                  No budget cap set for this category
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
