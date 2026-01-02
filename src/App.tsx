import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loading from './components/common/Loading';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './components/auth/RequireAuth';
import RequireOnboardingComplete from './components/auth/RequireOnboardingComplete';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const About = lazy(() => import('./pages/About'));
const WhyOpeari = lazy(() => import('./pages/WhyOpeari'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const Contact = lazy(() => import('./pages/Contact'));
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
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* PUBLIC ROUTES (Marketing Layout - Forces Guest Header) */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              <Route path="/why-opeari" element={<WhyOpeari />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/invite" element={<Invite />} />
              <Route path="/admin-waitlist" element={<AdminWaitlist />} />
              <Route path="/request-link" element={<RequestNewLink />} />
              <Route path="/auth/confirm" element={<AuthCallback />} />
            </Route>

            {/* ONBOARDING ROUTES (Protected but NOT AuthGated for completion) */}
            <Route element={
              <ProtectedRoute>
                <div className="min-h-screen flex flex-col">
                  <Header onboarding={true} />
                  <main className="flex-grow">
                    <Outlet />
                  </main>
                  {/* Footer optional/hidden for onboarding typically, or just Header */}
                  <Footer />
                </div>
              </ProtectedRoute>
            }>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/onboarding-success" element={<OnboardingSuccess />} />
              <Route path="/caregiver-interest" element={<CaregiverInterest />} />
              <Route path="/verify" element={<VerificationGate />} />
            </Route>

            {/* ERROR / 404 (Use Marketing Layout) */}
            <Route element={<MarketingLayout />}>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* APP ROUTES (Authenticated) */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>

                {/* 1. Accessible Restricted Routes (No Onboarding Check) */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />

                {/* 2. Accessible Core App (Require Onboarding Complete) */}
                <Route element={<RequireOnboardingComplete />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/nanny-share" element={<NannyShare />} />
                  <Route path="/build-your-village" element={<BuildYourVillage />} />
                  <Route path="/member/:id" element={<MemberProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:id" element={<Messages />} />
                  <Route path="/connections" element={<Connections />} />
                  <Route path="/invite-friends" element={<InviteFriends />} />

                  {/* Redirects */}
                  <Route path="/matches" element={<Navigate to="/build-your-village" replace />} />
                  <Route path="/village" element={<Navigate to="/connections" replace />} />
                </Route>

              </Route>
            </Route>

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
