import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { GoalProvider } from './context/GoalContext';
import RukminiChat from './components/chat/RukminiChat';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';

// Lazy load pages
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const BudgetAnalytics = React.lazy(() => import('./pages/BudgetAnalytics/BudgetAnalytics'));
const FinancialPosition = React.lazy(() => import('./pages/FinancialPosition/FinancialPosition'));
const GoalTracker = React.lazy(() => import('./pages/GoalTracker/GoalTracker'));
const MoodTracker = React.lazy(() => import('./pages/MoodTracker/MoodTracker'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Signup = React.lazy(() => import('./pages/auth/Signup'));
const Home = React.lazy(() => import('./pages/Home'));

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

// Add error boundary component at the top level
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <pre className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const hasToken = !!localStorage.getItem('token');

  console.log('[ProtectedRoute] user:', user, 'isAuthenticated:', isAuthenticated, 'hasToken:', hasToken);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated or no token, redirect to login
  if (!isAuthenticated || !hasToken) {
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
  let from = location.state?.from?.pathname;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    if (!from || from === '/' || from === '/login') {
      from = '/dashboard';
    }
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Prefetch data for the next route
  useEffect(() => {
    // Add route-specific prefetching logic here
    const prefetchRouteData = async () => {
      try {
        if (location.pathname === '/dashboard') {
          await queryClient.prefetchQuery({
            queryKey: ['dashboardData'],
            queryFn: () => fetchDashboardData()
          });
        }
      } catch (error) {
        console.error('Error prefetching dashboard data:', error);
      }
    };
    
    prefetchRouteData();
  }, [location, queryClient]);

  const prefetchRouteData = useCallback(async () => {
    if (user) {
      try {
        // Update query keys to use arrays
        await queryClient.prefetchQuery({
          queryKey: ['userData'],
          queryFn: () => fetchUserData(),
          staleTime: 5 * 60 * 1000 // 5 minutes
        });
        
        await queryClient.prefetchQuery({
          queryKey: ['goals'],
          queryFn: () => fetchGoals(),
          staleTime: 2 * 60 * 1000 // 2 minutes
        });
      } catch (error) {
        console.error('Error prefetching user data:', error);
      }
    }
  }, [user, queryClient]);

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Dashboard />
              </ErrorBoundary>
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/budget-analytics" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <BudgetAnalytics />
              </ErrorBoundary>
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial-position" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <FinancialPosition />
              </ErrorBoundary>
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/mood" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <MoodTracker />
              </ErrorBoundary>
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/goal-tracker" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <GoalTracker />
              </ErrorBoundary>
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route path="/login" element={
        <PublicRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <Login />
          </Suspense>
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <Signup />
          </Suspense>
        </PublicRoute>
      } />

      {/* 404 fallback - redirect to home for unknown routes */}
      <Route 
        path="*" 
        element={
          <Navigate to="/" replace />
        } 
      />
    </Routes>
  );
}

// Add memoization for stable components
const MemoizedSidebar = React.memo(Sidebar);
const MemoizedTopNav = React.memo(TopNav);

// Mock functions for prefetching (replace with actual API calls)
const fetchDashboardData = async () => {
  // TODO: Implement actual dashboard data fetching
  return {};
};

const fetchUserData = async () => {
  // TODO: Implement actual user data fetching
  return {};
};

const fetchGoals = async () => {
  // TODO: Implement actual goals fetching
  return [];
};

// Main App component with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoalProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingSpinner />}>
            <AppContent />
          </Suspense>
        </ErrorBoundary>
      </GoalProvider>
    </QueryClientProvider>
  );
}

export default App;
