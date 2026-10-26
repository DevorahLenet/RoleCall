import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Today } from './routes/Today'
import { Jobs } from './routes/Jobs'
import { JobDetail } from './routes/JobDetail'
import { WritingLibrary } from './routes/WritingLibrary'
import { Ratings } from './routes/Ratings'

// Routes match the settled nav vocabulary: Today · Jobs · Writing Library ·
// Ratings. Every screen renders inside AppShell, which owns the data and frame.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />
          <Route path="jobs" element={<Jobs />} />
          {/* The per-job workspace, reached from a card's role on the board. */}
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="writing" element={<WritingLibrary />} />
          {/* A piece is a PANEL over the library, not its own screen — so the
              deep link renders the same route with that panel open. */}
          <Route path="writing/:id" element={<WritingLibrary />} />
          {/* Placeholder until the ratings chart is designed. */}
          <Route path="ratings" element={<Ratings />} />
          {/* Unknown paths fall back to Today rather than a dead end. */}
          <Route path="*" element={<Today />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
