
import {
  BrainCircuit,
  Target,
  Database,
  ChartNoAxesCombined,
  Info,
  ChevronDown,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const metrics = [
  { label: 'Accuracy', value: '81.92%', icon: Target, detail: 'Correct predictions' },
  { label: 'Macro F1', value: '0.7301', icon: BrainCircuit, detail: 'Across 11 categories' },
  { label: 'Weighted F1', value: '0.8156', icon: ChartNoAxesCombined, detail: 'Support-weighted score' },
  { label: 'Test samples', value: '1,001', icon: Database, detail: 'Held-out records' },
]

const classMetrics = [
  { name: 'Checking or savings account', short: 'Checking', precision: 0.7602, recall: 0.8485, f1: 0.8019, support: 198 },
  { name: 'Credit card', short: 'Credit Card', precision: 0.7819, recall: 0.8305, f1: 0.8055, support: 177 },
  { name: 'Credit reporting or other personal consumer reports', short: 'Credit Reporting', precision: 0.7297, recall: 0.7500, f1: 0.7397, support: 36 },
  { name: 'Debt collection', short: 'Debt Collection', precision: 0.9007, recall: 0.9104, f1: 0.9055, support: 279 },
  { name: 'Debt or credit management', short: 'Debt Management', precision: 1.0000, recall: 0.3636, f1: 0.5333, support: 11 },
  { name: 'Money transfer, virtual currency, or money service', short: 'Money Transfer', precision: 0.7595, recall: 0.6977, f1: 0.7273, support: 86 },
  { name: 'Mortgage', short: 'Mortgage', precision: 0.9254, recall: 0.8857, f1: 0.9051, support: 70 },
  { name: 'Payday loan, title loan, personal loan, or advance loan', short: 'Payday Loan', precision: 0.5641, recall: 0.5500, f1: 0.5570, support: 40 },
  { name: 'Prepaid card', short: 'Prepaid', precision: 0.7500, recall: 0.2000, f1: 0.3158, support: 15 },
  { name: 'Student loan', short: 'Student Loan', precision: 1.0000, recall: 0.8500, f1: 0.9189, support: 40 },
  { name: 'Vehicle loan or lease', short: 'Vehicle Loan', precision: 0.8478, recall: 0.7959, f1: 0.8211, support: 49 },
]

const confusionMatrix = [
  [168, 11, 0, 2, 0, 13, 3, 1, 0, 0, 0],
  [11, 147, 0, 12, 0, 2, 0, 5, 0, 0, 0],
  [0, 3, 27, 5, 0, 0, 1, 0, 0, 0, 0],
  [1, 7, 10, 254, 0, 0, 0, 2, 1, 0, 4],
  [1, 2, 0, 2, 4, 0, 1, 1, 0, 0, 0],
  [25, 1, 0, 0, 0, 60, 0, 0, 0, 0, 0],
  [2, 2, 0, 0, 0, 0, 62, 4, 0, 0, 0],
  [8, 4, 0, 2, 0, 1, 0, 22, 0, 0, 3],
  [4, 5, 0, 0, 0, 3, 0, 0, 3, 0, 0],
  [0, 1, 0, 2, 0, 0, 0, 3, 0, 34, 0],
  [1, 5, 0, 3, 0, 0, 0, 1, 0, 0, 39],
]

const labels = classMetrics.map(item => item.short)
const maxCellValue = Math.max(...confusionMatrix.flat())

function MetricCard({ item }) {
  const Icon = item.icon

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
          <Icon size={19} />
        </div>
        <span className="text-xs text-slate-500">{item.detail}</span>
      </div>

      <p className="mt-5 text-3xl font-semibold text-white">{item.value}</p>
      <p className="mt-2 text-sm text-slate-400">{item.label}</p>
    </div>
  )
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function ConfusionMatrix() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="mb-4 text-right text-xs text-slate-500">
          Rows: Actual · Columns: Predicted
        </div>

        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: '125px repeat(11, minmax(0, 1fr))' }}
        >
          <div />

          {labels.map(label => (
            <div
              key={label}
              title={label}
              className="flex h-20 items-end justify-center pb-2 text-[10px] text-slate-400"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {label}
            </div>
          ))}

          {confusionMatrix.map((row, rowIndex) => (
            <>
              <div
                key={`label-${rowIndex}`}
                className="flex items-center pr-2 text-xs text-slate-400"
              >
                {labels[rowIndex]}
              </div>

              {row.map((value, colIndex) => {
                const intensity = value === 0 ? 0 : Math.max(0.12, value / maxCellValue)

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    title={`Actual: ${classMetrics[rowIndex].name}\nPredicted: ${classMetrics[colIndex].name}\nCount: ${value}`}
                    className="flex aspect-square items-center justify-center rounded text-[11px] text-slate-200"
                    style={{
                      backgroundColor: value === 0
                        ? 'rgba(30, 41, 59, 0.35)'
                        : `rgba(59, 130, 246, ${intensity * (rowIndex === colIndex ? 0.85 : 0.55)})`,
                    }}
                  >
                    {value}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailSection({ title, description, children }) {
  return (
    <details className="group rounded-2xl border border-slate-800 bg-[#101827]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <ChevronDown
          size={18}
          className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-slate-800 p-6">
        {children}
      </div>
    </details>
  )
}

function ModelPerformance() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-12">

      {/* Page heading */}
      <header className="border-b border-slate-800 pb-7">
        <p className="text-sm font-medium text-blue-400">Model evaluation</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Model Performance
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Performance analysis of the SupportLens complaint classification model.
        </p>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(item => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      {/* Configuration and scores */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
          <SectionHeading
            title="Model configuration"
            description="Training setup and parameters"
          />

          <div className="space-y-4">
            {[
              ['Algorithm', 'Linear SVM'],
              ['Feature extraction', 'TF-IDF'],
              ['Regularization (C)', '1.0'],
              ['Class weighting', 'Balanced'],
              ['Categories', '11'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-slate-800 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-medium text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
          <SectionHeading
            title="Evaluation scores"
            description="Overall performance on the held-out test set"
          />

          <div className="space-y-6">
            {[
              { label: 'Accuracy', value: 0.8192, display: '81.92%' },
              { label: 'Macro F1', value: 0.7301, display: '0.7301' },
              { label: 'Weighted F1', value: 0.8156, display: '0.8156' },
            ].map(item => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-medium text-white">{item.display}</span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${item.value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-6 text-slate-500">
            Macro F1 treats each category equally. Weighted F1 accounts for
            differences in category frequency.
          </p>
        </div>
      </section>

      {/* Class comparison chart */}
      <section className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
        <SectionHeading
          title="Class-wise performance"
          description="Precision, recall and F1-score across all 11 complaint categories"
        />

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classMetrics}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#263247" />

              <XAxis
                type="number"
                domain={[0, 1]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />

              <YAxis
                type="category"
                dataKey="short"
                width={115}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#101827',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#fff',
                }}
                formatter={value => Number(value).toFixed(4)}
              />

              <Legend />
              <Bar dataKey="precision" name="Precision" fill="#3b82f6" />
              <Bar dataKey="recall" name="Recall" fill="#a78bfa" />
              <Bar dataKey="f1" name="F1 Score" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Strengths and limitations */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/15 bg-[#101827] p-6">
          <h2 className="font-semibold text-white">Model strengths</h2>

          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-400">
            <li>• Student loan F1-score: 0.9189</li>
            <li>• Debt collection F1-score: 0.9055</li>
            <li>• Mortgage F1-score: 0.9051</li>
            <li>• Stronger results across several high-support categories.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-500/15 bg-[#101827] p-6">
          <h2 className="font-semibold text-white">Areas for improvement</h2>

          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-400">
            <li>• Prepaid card F1-score: 0.3158 (15 test examples).</li>
            <li>• Debt management recall: 0.3636.</li>
            <li>• Payday loan F1-score: 0.5570.</li>
            <li>• Some confusion between checking accounts and money transfers.</li>
          </ul>
        </div>
      </section>

      {/* Classification report */}
      <DetailSection
        title="Classification report"
        description="Detailed precision, recall, F1-score and support for each category"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500">
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="px-3 pb-3 font-medium">Precision</th>
                <th className="px-3 pb-3 font-medium">Recall</th>
                <th className="px-3 pb-3 font-medium">F1-score</th>
                <th className="pb-3 pl-3 text-right font-medium">Support</th>
              </tr>
            </thead>

            <tbody>
              {classMetrics.map(item => (
                <tr
                  key={item.name}
                  className="border-b border-slate-800/80 last:border-0"
                >
                  <td className="py-3 pr-4 text-slate-300">{item.name}</td>
                  <td className="px-3 py-3 text-slate-300">{item.precision.toFixed(4)}</td>
                  <td className="px-3 py-3 text-slate-300">{item.recall.toFixed(4)}</td>
                  <td className={`px-3 py-3 font-medium ${item.f1 < 0.6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.f1.toFixed(4)}
                  </td>
                  <td className="py-3 pl-3 text-right text-slate-400">{item.support}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t border-slate-700 font-semibold">
                <td className="pt-4 text-white">Macro average</td>
                <td className="px-3 pt-4 text-slate-300">0.8199</td>
                <td className="px-3 pt-4 text-slate-300">0.6984</td>
                <td className="px-3 pt-4 text-white">0.7301</td>
                <td className="pt-4 text-right text-slate-400">1,001</td>
              </tr>

              <tr className="font-semibold">
                <td className="pt-3 text-white">Weighted average</td>
                <td className="px-3 pt-3 text-slate-300">0.8221</td>
                <td className="px-3 pt-3 text-slate-300">0.8192</td>
                <td className="px-3 pt-3 text-white">0.8156</td>
                <td className="pt-3 text-right text-slate-400">1,001</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DetailSection>

      {/* Confusion matrix */}
      <DetailSection
        title="Confusion matrix"
        description="Inspect correct predictions and misclassifications across categories"
      >
        <ConfusionMatrix />
      </DetailSection>

      {/* Evaluation note */}
      <div className="flex gap-3 rounded-2xl border border-slate-800 bg-[#0d1421] p-5">
        <Info size={17} className="mt-0.5 shrink-0 text-slate-500" />

        <p className="text-xs leading-6 text-slate-500">
          Evaluation uses 1,001 held-out records after excluding rows with
          missing target labels. Results for categories with fewer examples
          may be less stable. SupportLens provides classification assistance
          and does not replace human review.
        </p>
      </div>

    </div>
  )
}

export default ModelPerformance
