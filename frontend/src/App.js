import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import PR from "./pages/PR";
import Personnel from "./pages/Personnel";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">หน้าหลัก</Link> |{" "}
        <Link to="/pr">ประชาสัมพันธ์</Link> |{" "}
        <Link to="/personnel">จัดการบุคลากร</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pr" element={<PR />} />
        <Route path="/personnel" element={<Personnel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;