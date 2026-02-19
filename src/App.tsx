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
import DevDebugPanel from './components/dev/DevDebugPanel';

// ... (imports)

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
// ... 
// ... 
// ...

// ...





{/* APP ROUTES (Authenticated) */ }
const HowItWorks = lazy(() => import('./pages/HowItWorks'));

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

// V1 Feed Pivot -> Village Home
// const VillageHome = lazy(() => import('./pages/Village/VillageHome.tsx'));

// Legacy / Future Features (Hidden for V1)
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Matches = lazy(() => import('./pages/Matches')); // Replaces legacy Village
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const MessagesInbox = lazy(() => import('./pages/MessagesInbox'));
const PostsPage = lazy(() => import('./pages/PostsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
// const Connections = lazy(() => import('./pages/Connections'));
// const InviteFriends = lazy(() => import('./pages/InviteFriends'));
// const NannyShare = lazy(() => import('./pages/NannyShare'));

import RouteErrorBoundary from './components/common/RouteErrorBoundary';

// ... (existing imports)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <RouteErrorBoundary>
            <Routes>
              {/* PUBLIC ROUTES (Marketing Layout - Forces Guest Header) */}
              <Route element={<MarketingLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/why-opeari" element={<WhyOpeari />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/invite" element={<Invite />} />
              </Route>

              {/* AUTH ROUTES (Standalone - No Layout Wrapper) */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/request-link" element={<RequestNewLink />} />
              <Route path="/auth/confirm" element={<AuthCallback />} />

              {/* ONBOARDING ROUTES */}
              <Route element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Header onboarding={true} />
                    <main id="main-content" className="flex-grow focus:outline-none" tabIndex={-1}>
                      <Outlet />
                    </main>
                    <Footer />
                  </div>
                </ProtectedRoute>
              }>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/caregiver-interest" element={<CaregiverInterest />} />
                <Route path="/verify" element={<VerificationGate />} />
              </Route>

              // ... (existing imports)

              // Inside Routes:


              {/* APP ROUTES (Authenticated) */}
              <Route element={<RequireAuth />}>
                <Route path="/admin-waitlist" element={<AdminWaitlist />} />
                <Route element={<AppLayout />}>

                  {/* 1. Accessible Restricted Routes */}
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* 2. Accessible Core App (Require Onboarding Complete) */}
                  <Route element={<RequireOnboardingComplete />}>

                    {/* V1 Village Home: The main authenticated post-login experience */}
                    <Route path="/village" element={<Dashboard />} />

                    {/* Core V1 Features */}
                    <Route path="/matches" element={<Matches />} /> {/* New Role-Based Matches */}
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/posts" element={<PostsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/messages" element={<MessagesInbox />} />
                    <Route path="/messages/:id" element={<Messages />} />
                    <Route path="/member/:id" element={<MemberProfile />} />
                    <Route path="/profile/:id" element={<Profile />} />

                    {/* Redirects & Locks */}
                    <Route path="/dashboard" element={<Navigate to="/village" replace />} />

                    {/* Other routes */}
                    {/* <Route path="/build-your-village" element={<Navigate to="/village" replace />} /> */}

                  </Route>
                </Route>
              </Route>

              {/* ERROR / 404 - Must be last */}
              <Route element={<MarketingLayout />}>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </RouteErrorBoundary>
        </Suspense>
        <DevDebugPanel />
      </Router>
    </AuthProvider>
  );
}

export default App;
