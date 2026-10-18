import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/homepage";
import LoginPage from "./pages/LoginPage";
import RequesterDashboard from "./pages/RequesterDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import CoordinatorRequestDetail from "./pages/CoordinatorRequestDetail";
import SpecialistRequestDetail from "./pages/SpecialistRequestDetail";
import RequesterRequestDetail from "./pages/RequesterRequestDetail";
import RegisterPage from "./pages/RegisterPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* One route per role's dashboard. */}
        <Route path="/requester" element={<RequesterDashboard />} />
        <Route path="/coordinator" element={<CoordinatorDashboard />} />
        <Route path="/specialist" element={<SpecialistDashboard />} />
        <Route path="/coordinator/request/:id" element={<CoordinatorRequestDetail />} />
        <Route path="/specialist/request/:id" element={<SpecialistRequestDetail />} />
        <Route path="/requester/request/:id" element={<RequesterRequestDetail />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;