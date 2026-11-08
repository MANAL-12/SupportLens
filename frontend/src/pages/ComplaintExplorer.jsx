import API_BASE_URL from '../api'
import { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Loader2,
  Database,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

function ComplaintExplorer() {
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [source, setSource] = useState('All')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/complaints/categories`)
      .then(res => {
        if (!res.ok) throw new Error('Unable to load categories')
        return res.json()
      })
      .then(setCategories)
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchComplaints() {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({
          search,
          category,
          source,
          page: String(page),
          limit: '10',
        })

        const response = await fetch(
          `${API_BASE_URL}/api/complaints?${params}`,
          { signal: controller.signal }
        )

        if (!response.ok) throw new Error('Unable to load complaints')

        const data = await response.json()
        setComplaints(data.complaints)
        setTotal(data.total)
        setTotalPages(data.total_pages || 1)
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchComplaints()
    return () => controller.abort()
  }, [search, category, source, page])

  const formatDate = date => {
    if (!date) return '—'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setSource('All')
    setPage(1)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 pb-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-5 border-b border-slate-800 pb-7 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
            Workspace / Explorer
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Complaint Explorer
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Search, filter and inspect customer complaints stored in SupportLens.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-xs text-slate-400">
          <Database size={16} className="text-blue-400" />
          Connected to database
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/80 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Matching complaints</p>
            <FileText size={19} className="text-blue-400" />
          </div>

          <p className="mt-5 text-3xl font-semibold text-white">
            {total.toLocaleString('en-IN')}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Records matching current filters
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Available categories</p>
            <SlidersHorizontal size={19} className="text-violet-400" />
          </div>

          <p className="mt-5 text-3xl font-semibold text-white">
            {categories.length}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Distinct complaint categories
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Records per page</p>
            <Database size={19} className="text-emerald-400" />
          </div>

          <p className="mt-5 text-3xl font-semibold text-white">10</p>

          <p className="mt-2 text-xs text-slate-500">
            Paginated database results
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-700/80 bg-[#111827] p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Filter size={18} className="text-blue-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Search and filters
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Narrow down the complaint records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white"
          >
            <RefreshCw size={13} />
            Clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px_180px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search complaint, company or ID..."
              className="w-full rounded-xl border border-slate-700 bg-[#090f1b] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={category}
            onChange={e => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-slate-700 bg-[#090f1b] px-4 py-3.5 text-sm text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="">All categories</option>
            {categories.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            value={source}
            onChange={e => {
              setSource(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-slate-700 bg-[#090f1b] px-4 py-3.5 text-sm text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="All">All sources</option>
            <option value="CFPB">CFPB</option>
            <option value="User submitted">User submitted</option>
          </select>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Complaint records */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#111827]">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-700/80 px-6 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Database size={18} className="text-blue-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Complaint records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select a record to inspect its details.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-lg border border-slate-700 bg-[#090f1b] px-3 py-2 text-xs text-slate-400">
            {total.toLocaleString('en-IN')} records
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
            <Loader2 className="animate-spin text-blue-400" size={20} />
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl border border-slate-700 bg-[#090f1b] p-4">
              <FileText size={28} className="text-slate-500" />
            </div>

            <p className="mt-4 font-medium text-slate-300">
              No complaints found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-[#090f1b] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Complaint ID</th>
                  <th className="px-6 py-4 font-medium">Complaint</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {complaints.map(item => (
                  <tr
                    key={item.complaint_id}
                    onClick={() => setSelected(item)}
                    className="cursor-pointer transition-colors hover:bg-blue-500/[0.04]"
                  >
                    <td className="whitespace-nowrap px-6 py-5 text-xs text-slate-400">
                      {item.complaint_id}
                    </td>

                    <td className="max-w-sm px-6 py-5">
                      <p className="line-clamp-2 leading-6 text-slate-300">
                        {item.complaint_text}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span className="inline-block max-w-[220px] truncate rounded-lg border border-blue-500/20 bg-blue-500/[0.08] px-3 py-1.5 text-xs text-blue-300">
                        {item.category || 'Unclassified'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                      {item.company || '—'}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                      {formatDate(item.complaint_date)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-400">
                        {item.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-4 border-t border-slate-700/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {complaints.length} of {total.toLocaleString('en-IN')} complaints
          </p>

          <div className="flex items-center gap-3">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-700 p-2.5 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="min-w-24 text-center text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-700 p-2.5 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Complaint detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-[#111827] px-7 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Complaint details
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  #{selected.complaint_id}
                </h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-700 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-7 p-7">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Complaint description
                </h3>

                <div className="rounded-xl border border-slate-700 bg-[#090f1b] p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {selected.complaint_text}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Record information
                </h3>

                <div className="grid grid-cols-1 gap-5 rounded-xl border border-slate-700 bg-[#090f1b] p-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Predicted category</p>
                    <p className="text-sm leading-6 text-blue-400">
                      {selected.category || '—'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Company</p>
                    <p className="text-sm text-slate-300">
                      {selected.company || '—'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm text-slate-300">
                      {formatDate(selected.complaint_date)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Source</p>
                    <p className="text-sm text-slate-300">
                      {selected.source || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {selected.summary && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Sparkles size={16} className="text-violet-400" />
                    Gemini summary
                  </h3>

                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.05] p-5">
                    <p className="text-sm leading-7 text-slate-300">
                      {selected.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintExplorer
