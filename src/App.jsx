import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MobilePage, NewJudgePage, NewRoundPage, TablePage } from "./Pages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NewRoundPage />} />
        <Route path="/mobile" element={<MobilePage />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/newjudge" element={<NewJudgePage />} />
      </Routes>
    </Router>
  );
}

export default App;
