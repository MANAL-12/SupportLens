import API_BASE_URL from '../api'
import { useEffect, useState } from 'react'
import {
  Database,
  Layers3,
  Tags,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const stats = [
  {
    label: 'Total Complaints',
    key: 'total_complaints',
    description: 'CFPB records in dataset',
    icon: Database,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'Product Categories',
    key: 'total_categories',
    description: 'Classification classes',
    icon: Layers3,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    label: 'Unique Issues',
    key: 'total_issues',
    description: 'Distinct complaint issues',
    icon: Tags,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Model Accuracy',
    key: 'model_accuracy',
    description: 'Held-out test set',
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
]

const chartColors = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#64748b',
  '#d946ef',
  '#14b8a6',
  '#f97316',
  '#a3a3a3',
]

const panelClass =
  'rounded-2xl border border-slate-800/90 bg-[#101827] p-7 shadow-lg shadow-black/10'

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dashboard/stats`),
          fetch(`${API_BASE_URL}/api/dashboard/categories`),
        ])

        if (!statsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Unable to fetch dashboard data')
        }

        const statsData = await statsResponse.json()
        const categories = await categoriesResponse.json()

        setDashboardData(statsData)

        setCategoryData(
          categories.map((item) => ({
            name: item.category,
            value: item.count,
          }))
        )
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-10 pb-10">

      {/* Page heading */}
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-blue-400">
            WORKSPACE / OVERVIEW
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Monitor customer complaints and classification performance.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#101827] px-5 py-3 text-sm text-slate-300">
          <Activity size={17} className="text-emerald-400" />
          Dataset overview
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
          Unable to load dashboard data: {error}
        </div>
      )}

      {/* Metric cards */}
      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white">
            Dataset at a glance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Key statistics from the complaint dataset
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.key}
                className={`${panelClass} min-h-[175px] transition-all duration-200 hover:-translate-y-1 hover:border-slate-700`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-400">
                    {stat.label}
                  </p>

                  <div className={`rounded-xl p-3 ${stat.bg}`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                </div>

                <p className="mt-7 text-3xl font-semibold tracking-tight text-white">
                  {loading
                    ? '...'
                    : error
                      ? '—'
                      : stat.key === 'model_accuracy'
                        ? `${dashboardData[stat.key]}%`
                        : dashboardData[stat.key]?.toLocaleString('en-IN')}
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Complaint charts */}
      <section>
        <div className="mb-6">
          <h2 className="text-base font-semibold text-white">
            Complaint Insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Explore how complaints are distributed across financial products.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">

          {/* Bar chart */}
          <div className={`${panelClass} min-w-0`}>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white">
                Complaint Distribution
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Number of complaints grouped by product category
              </p>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    stroke="#64748b"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151c2e',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#fff',
                      padding: '12px',
                    }}
                  />

                  <Bar
                    dataKey="value"
                    name="Complaints"
                    fill="#6366f1"
                    radius={[0, 6, 6, 0]}
                    barSize={19}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-6 border-t border-slate-800 pt-5 text-xs text-slate-500">
              Based on the 5,000-record CFPB dataset sample.
            </p>
          </div>

          {/* Donut chart */}
          <div className={`${panelClass} min-w-0`}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                Category Share
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Proportion of complaints by category
              </p>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {categoryData.map((category, index) => (
                      <Cell
                        key={category.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151c2e',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#fff',
                      padding: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 max-h-[260px] space-y-4 overflow-y-auto border-t border-slate-800 pt-5 pr-2">
              {categoryData.map((category, index) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: chartColors[index % chartColors.length],
                      }}
                    />

                    <span className="truncate text-sm text-slate-400">
                      {category.name}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-slate-200">
                    {category.value.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Model performance */}
      <section className={`${panelClass}`}>
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-violet-500/10 p-3">
            <BarChart3 size={22} className="text-violet-400" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Classification Model
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              TF-IDF + Linear Support Vector Machine
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0d1421] p-5">
            <p className="text-sm text-slate-400">Accuracy</p>
            <p className="mt-3 text-2xl font-semibold text-white">81.9%</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1421] p-5">
            <p className="text-sm text-slate-400">Macro F1-score</p>
            <p className="mt-3 text-2xl font-semibold text-white">0.7283</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1421] p-5">
            <p className="text-sm text-slate-400">Weighted F1-score</p>
            <p className="mt-3 text-2xl font-semibold text-white">0.8154</p>
          </div>
        </div>
      </section>

      {/* Dataset note */}
      <section className="rounded-2xl border border-slate-800/80 bg-[#0d1421] p-6">
        <p className="text-xs leading-6 text-slate-500">
          <span className="font-semibold text-slate-400">Dataset note:</span>{' '}
          This dashboard uses a 5,000-record sample collected from CFPB
          complaint data for June 2026. It is a selected sample, not a
          random or exhaustive representation of all consumer complaints.
        </p>
      </section>

    </div>
  )
}

export default Dashboard
