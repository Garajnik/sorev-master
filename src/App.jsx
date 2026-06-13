import "./global.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  HistoryPage,
  MobilePage,
  NewJudgePage,
  NewRoundPage,
  TablePage,
} from "./Pages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NewRoundPage />} />
        <Route path="/mobile" element={<MobilePage />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/connect" element={<NewJudgePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
