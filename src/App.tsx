import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { CreateQuizPage } from './pages/CreateQuizPage'
import { DashboardPage } from './pages/DashboardPage'
import { ImportQuizPage } from './pages/ImportQuizPage'
import { PlayQuizPage } from './pages/PlayQuizPage'
import { ResultPage } from './pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/import" element={<ImportQuizPage />} />
        <Route path="/create" element={<CreateQuizPage />} />
        <Route path="/play/:quizId" element={<PlayQuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
