import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { Part1Quiz } from './pages/Part1Quiz';
import { Part2Quiz } from './pages/Part2Quiz';
import { Results } from './pages/Results';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/part1" element={<Part1Quiz />} />
          <Route path="/part2" element={<Part2Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
