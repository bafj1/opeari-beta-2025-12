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
import RequestNewLink from './pages/RequestNewLink';
import SignIn from './pages/SignIn';

// Onboarding (first-time setup wizard)
// Onboarding (first-time setup wizard)
import Onboarding from './pages/Onboarding';

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
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/admin-waitlist" element={<AdminWaitlist />} />
          <Route path="/request-link" element={<RequestNewLink />} />

          {/* Onboarding - Protected */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Main logged-in experience - Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/build-your-village"
            element={
              <ProtectedRoute>
                <BuildYourVillage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/:id"
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:id"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
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
