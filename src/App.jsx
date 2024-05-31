import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MobilePage from "./Pages/MobilePage";
import TablePage from "./Pages/TablePage";
import NewJudge from "./Pages/NewJudge";
import StartPage from "./Pages/StartPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/mobile" element={<MobilePage />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/newjudge" element={<NewJudge />} />
      </Routes>
    </Router>
  );
}

export default App;
