import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 0 60px rgba(0, 212, 255, 0.3)' }}>
          <video
            data-testid="hero-video"
            className="w-full h-auto"
            autoPlay
            muted
            loop
            playsInline
            controls
          >
            <source 
              src="https://customer-assets.emergentagent.com/job_0ea17f9b-036f-4647-b184-4c6088ba5c71/artifacts/bqhebzix_1770533452396_20260207224837328.mp4" 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
