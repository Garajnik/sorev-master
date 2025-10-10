import "./global.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MobilePage, NewJudgePage, NewRoundPage, TablePage } from "./Pages";
import { TablePageLegacy } from "./Pages/TablePageLegacy/TablePageLegacy.component";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NewRoundPage />} />
        <Route path="/mobile" element={<MobilePage />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/tableLegacy" element={<TablePageLegacy />} />
        <Route path="/newjudge" element={<NewJudgePage />} />
      </Routes>
    </Router>
  );
}

export default App;
