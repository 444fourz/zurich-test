import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ApplyPage from "./pages/ApplyPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ReferralsPage from "./pages/ReferralsPage";
import RegisterPage from "./pages/RegisterPage";
import StatusPage from "./pages/StatusPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="apply" element={<ApplyPage />} />
        <Route path="applications" element={<StatusPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
