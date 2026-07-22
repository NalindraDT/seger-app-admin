import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import SubmissionsPage from './pages/SubmissionsPage';
import ActivityTypesPage from './pages/ActivityTypesPage';
import UsersPage from './pages/UsersPage';
import RulesPage from './pages/RulesPage';
import RewardsPage from './pages/RewardsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SettingsPage from './pages/SettingsPage';
import BadgesPage from './pages/BadgesPage';
import EventsPage from './pages/EventsPage';
import StreakPage from './pages/StreakPage';
import UserProfilePage from './pages/UserProfilePage';
import DepartmentsPage from './pages/DepartmentsPage';
import CompaniesPage from './pages/CompaniesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Otomatis arahkan ke halaman login jika user membuka web root (/) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Halaman Login */}
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/aktifitas" element={<ActivityTypesPage/>} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/aturan" element={<RulesPage />} />
          <Route path="/hadiah" element={<RewardsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/streak" element={<StreakPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/settings" element={<SettingsPage/>} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;