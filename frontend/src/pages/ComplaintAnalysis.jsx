
import { useState } from 'react'
import {
  BrainCircuit,
  Building2,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function ComplaintAnalysis() {
  const [complaint, setComplaint] = useState('')
  const [company, setCompany] = useState('')
  const [allowGemini, setAllowGemini] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/complaints/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            complaint_text: complaint,
            company: company || null,
            allow_gemini: allowGemini,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Complaint analysis failed.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-12">

      {/* Page header */}
      <header className="border-b border-slate-800 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
          Workspace / Analysis
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Complaint Analysis
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Classify customer complaints and generate AI-powered summaries.
        </p>
      </header>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#111827]"
      >
        {/* Form heading */}
        <div className="border-b border-slate-700/80 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
              <FileText size={21} className="text-blue-400" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Submit a complaint
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Provide the complaint details for classification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 p-7">

          {/* Complaint description */}
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                01 / Complaint details
              </p>
              <h3 className="mt-2 text-sm font-semibold text-white">
                Complaint description
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Describe the customer's issue, actions taken, and requested resolution.
              </p>
            </div>

            <textarea
              value={complaint}
              onChange={(event) => setComplaint(event.target.value)}
              placeholder="Enter the full complaint description here..."
              rows={8}
              maxLength={10000}
              required
              minLength={10}
              className="w-full resize-y rounded-xl border border-slate-700 bg-[#090f1b] p-5 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

            <p className="text-right text-xs text-slate-500">
              {complaint.length.toLocaleString('en-IN')} / 10,000 characters
            </p>
          </section>

          <div className="border-t border-slate-800" />

          {/* Company information */}
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                02 / Additional information
              </p>
              <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Building2 size={16} className="text-slate-400" />
                Company information
                <span className="font-normal text-slate-500">(Optional)</span>
              </h3>
            </div>

            <input
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Enter company name"
              className="w-full rounded-xl border border-slate-700 bg-[#090f1b] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </section>

          <div className="border-t border-slate-800" />

          {/* Gemini consent */}
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                03 / AI summarization
              </p>
              <h3 className="mt-2 text-sm font-semibold text-white">
                Generate an AI-powered summary
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Optionally use Google Gemini to create a concise summary of the complaint.
              </p>
            </div>

            <label
              htmlFor="gemini-consent"
              className="flex cursor-pointer items-start gap-4 rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-5 transition hover:border-violet-500/40"
            >
              <input
                id="gemini-consent"
                type="checkbox"
                checked={allowGemini}
                onChange={(event) => setAllowGemini(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-violet-500"
              />

              <div>
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles size={16} className="text-violet-400" />
                  Allow Google Gemini processing
                </span>

                <span className="mt-2 block text-xs leading-6 text-slate-400">
                  If enabled, the complaint will be sent to Google's Gemini API
                  after common personal identifiers are redacted. Review the
                  text before consenting. Redaction may not remove every
                  sensitive detail.
                </span>
              </div>
            </label>
          </section>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="border-t border-slate-800 pt-6">
            <button
              type="submit"
              disabled={loading || complaint.trim().length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing complaint...
                </>
              ) : (
                <>
                  <BrainCircuit size={18} />
                  Analyze complaint
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Classification is performed using the trained SupportLens model.
            </p>
          </div>
        </div>
      </form>

      {/* Analysis result */}
      {result && (
        <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#111827]">

          <div className="flex items-center gap-3 border-b border-slate-700/80 px-7 py-6">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <CheckCircle2 size={21} className="text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Analysis completed
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Complaint classification has been completed successfully.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-7 p-7">

            {/* Result metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-[#090f1b] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Complaint ID
                </p>
                <p className="mt-3 break-all text-xl font-semibold text-white">
                  {result.complaint_id}
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Predicted category
                </p>
                <p className="mt-3 text-lg font-semibold leading-7 text-blue-400">
                  {result.predicted_category}
                </p>
              </div>
            </div>

            {/* Gemini summary */}
            <div className="rounded-xl border border-slate-700 bg-[#090f1b] p-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Sparkles size={17} className="text-violet-400" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Gemini summary
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    AI-generated complaint overview
                  </p>
                </div>
              </div>

              {result.summary ? (
                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {result.summary}
                </p>
              ) : (
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  {result.summary_status === 'failed'
                    ? 'Gemini could not generate the summary. The complaint classification was still completed.'
                    : 'Summary generation was skipped because external processing was not enabled.'}
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default ComplaintAnalysis
