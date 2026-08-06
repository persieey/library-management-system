import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PR from "./pages/PR";
import Personnel from "./pages/Personnel";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* หน้าประชาสัมพันธ์คือหน้าแรกของเว็บ */}
          <Route path="/" element={<PR />} />
          <Route path="/personnel" element={<Personnel />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
