import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Waitlist from './pages/Waitlist';
import Login from './pages/Login';
import Invite from './pages/Invite';
import AdminWaitlist from './pages/AdminWaitlist';

// Onboarding (first-time setup wizard)
import ProfileWizard from './pages/ProfileWizard';

// Main logged-in experience
import Dashboard from './pages/Dashboard';
import BuildYourVillage from './pages/BuildYourVillage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MemberProfile from './pages/MemberProfile';
import Messages from './pages/Messages';
import Connections from './pages/Connections';
import InviteFriends from './pages/InviteFriends';

// Feature pages
import NannyShare from './pages/NannyShare';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/admin-waitlist" element={<AdminWaitlist />} />

          {/* Onboarding - first time setup */}
          <Route path="/onboarding" element={<ProfileWizard />} />

          {/* Main logged-in experience */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/build-your-village" element={<BuildYourVillage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/member/:id" element={<MemberProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/connections" element={<Connections />} />
          <Route
            path="/invite-friends"
            element={
              <ProtectedRoute>
                <InviteFriends />
              </ProtectedRoute>
            }
          />

          {/* Redirects - consolidate old routes */}
          <Route path="/matches" element={<Navigate to="/build-your-village" replace />} />
          <Route path="/village" element={<Navigate to="/connections" replace />} />

          {/* Feature pages */}
          <Route path="/nanny-share" element={<NannyShare />} />

          {/* 404 - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;