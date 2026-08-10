import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Today } from './routes/Today'
import { Jobs } from './routes/Jobs'
import { WritingLibrary } from './routes/WritingLibrary'

// Routes match the settled nav vocabulary: Today · Jobs · Writing Library.
// Every screen renders inside AppShell, which owns the data and the frame.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="writing" element={<WritingLibrary />} />
          {/* Unknown paths fall back to Today rather than a dead end. */}
          <Route path="*" element={<Today />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
