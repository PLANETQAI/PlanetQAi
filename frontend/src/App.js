import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlanetQGames from "./pages/PlanetQGames";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PlanetQGames />} />
          <Route path="/planetqgames" element={<PlanetQGames />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
