import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';  
import { GoalProvider } from './context/GoalContext';
import RukminiChat from './components/chat/RukminiChat';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';

// Pages
import Dashboard from "./pages/dashboard/Dashboard";
import BudgetAnalytics from './pages/BudgetAnalytics/BudgetAnalytics';
import FinancialPosition from './pages/FinancialPosition/FinancialPosition';
import GoalTracker from './pages/GoalTracker/GoalTracker';
import MoodTracker from './pages/MoodTracker/MoodTracker';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/Home';

// Create a query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Modern loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
    </div>
  </div>
);

// A wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading, refreshToken } = useAuth();
  const location = useLocation();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasToken = !!localStorage.getItem('token');

  // Handle initial auth check and token refresh
  useEffect(() => {
    const checkAuthStatus = async () => {
      // If we're already authenticated, no need to check
      if (isAuthenticated) {
        setInitialCheckDone(true);
        return;
      }

      // If we have a token but not authenticated, try to refresh it
      if (hasToken && !isAuthenticated && !isRefreshing) {
        console.log('[ProtectedRoute] Token found but not authenticated, attempting refresh...');
        setIsRefreshing(true);
        try {
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            console.log('[ProtectedRoute] Token refresh failed, redirecting to login');
            // Clear any invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('[ProtectedRoute] Error during token refresh:', error);
        } finally {
          setIsRefreshing(false);
          setInitialCheckDone(true);
        }
      } else {
        // No token or already checked
        setInitialCheckDone(true);
      }
    };

    checkAuthStatus();
  }, [isAuthenticated, hasToken, refreshToken, isRefreshing]);

  // Show loading spinner while checking auth state
  if (isLoading || !initialCheckDone || isRefreshing) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have valid user data, render the protected content
  if (user && (user.id || user.userId || user.user_id)) {
    return children;
  }

  // If we get here, there's an issue with user data
  console.warn('[ProtectedRoute] Invalid user data, redirecting to login');
  return <Navigate to="/login" state={{ from: location }} replace />;
};

// A wrapper for public-only routes
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return children;
};

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
  >
    {children}
  </motion.div>
);

// Layout for authenticated users
const AuthenticatedLayout = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 768 && isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Sidebar ref={sidebarRef} isOpen={isSidebarOpen} />
      <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <RukminiChat />
      <main className="pl-64 pt-20 min-h-screen transition-all duration-300">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <div className="p-4">
              {children}
            </div>
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
};

// Main App content with layout
function AppContent() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes location={location} key={location.pathname}>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/budget-analytics" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <BudgetAnalytics />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/financial-position" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FinancialPosition />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/mood" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <MoodTracker />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/goal-tracker" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <GoalTracker />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GoalProvider>
          <AppContent />
        </GoalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
