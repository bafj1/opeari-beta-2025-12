import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loading from './components/common/Loading';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const About = lazy(() => import('./pages/About'));
const WhyOpeari = lazy(() => import('./pages/WhyOpeari'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const Login = lazy(() => import('./pages/Login'));
const Invite = lazy(() => import('./pages/Invite'));
const AdminWaitlist = lazy(() => import('./pages/AdminWaitlist'));

const RequestNewLink = lazy(() => import('./pages/RequestNewLink'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const SignIn = lazy(() => import('./pages/SignIn'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// Onboarding
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CaregiverInterest = lazy(() => import('./pages/CaregiverInterest'));
const VerificationGate = lazy(() => import('./pages/VerificationGate'));
const OnboardingSuccess = lazy(() => import('./pages/OnboardingSuccess'));

// Dashboard & Features
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BuildYourVillage = lazy(() => import('./pages/BuildYourVillage'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const Connections = lazy(() => import('./pages/Connections'));
const InviteFriends = lazy(() => import('./pages/InviteFriends'));
const NannyShare = lazy(() => import('./pages/NannyShare'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/why-opeari" element={<WhyOpeari />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/admin-waitlist" element={<AdminWaitlist />} />
            <Route path="/request-link" element={<RequestNewLink />} />

            {/* Auth Callback for PKCE / Magic Links */}
            <Route path="/auth/confirm" element={<AuthCallback />} />

            {/* Onboarding - Protected */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/onboarding-success" element={<ProtectedRoute><OnboardingSuccess /></ProtectedRoute>} />
            <Route path="/caregiver-interest" element={<ProtectedRoute><CaregiverInterest /></ProtectedRoute>} />
            <Route path="/verify" element={<ProtectedRoute><VerificationGate /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/nanny-share" element={<ProtectedRoute><NannyShare /></ProtectedRoute>} />
            <Route path="/build-your-village" element={<ProtectedRoute><BuildYourVillage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/member/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
            <Route path="/invite-friends" element={<ProtectedRoute><InviteFriends /></ProtectedRoute>} />

            {/* Redirects */}
            <Route path="/matches" element={<Navigate to="/build-your-village" replace />} />
            <Route path="/village" element={<Navigate to="/connections" replace />} />

            {/* Feature Pages */}


            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
