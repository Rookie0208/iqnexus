import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AdmitCard from "./pages/AdmitCard";
import Results from "./pages/Results";
import StudyMaterials from "./pages/StudyMaterials";
import Certificates from "./pages/Certificates";
import Feedback from "./pages/Feedback";
import PracticeOMR from "./pages/PracticeOMR";
import Sidebar from "./pages/Sidebar";
import AnswerKey  from "./pages/AnswerKey";

function App() {
  const user = useSelector((state) => state.auth.user);
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route element={<Sidebar />}>
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admit-card"
            element={user ? <AdmitCard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/results"
            element={user ? <Results /> : <Navigate to="/" replace />}
          />
          <Route
            path="/study-materials"
            element={user ? <StudyMaterials /> : <Navigate to="/" replace />}
          />
          <Route
            path="/certificates"
            element={user ? <Certificates /> : <Navigate to="/" replace />}
          />
        
          <Route
            path="/answer-key"
            element={user ? <AnswerKey /> : <Navigate to="/" replace />}
          />
          <Route
            path="/feedback"
            element={user ? <Feedback /> : <Navigate to="/" replace />}
          />
          <Route
            path="/practice-omr"
            element={user ? <PracticeOMR /> : <Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
