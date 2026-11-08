
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ComplaintAnalysis from './pages/ComplaintAnalysis'
import ComplaintExplorer from './pages/ComplaintExplorer'
import ModelPerformance from './pages/ModelPerformance'
function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-[#080b14]">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-x-hidden px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<ComplaintAnalysis />} />
            <Route path="/explorer" element={<ComplaintExplorer />} />
            <Route path="/model" element={<ModelPerformance />} />
            <Route path="*" element={<div className="text-slate-400">Page coming soon.</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
