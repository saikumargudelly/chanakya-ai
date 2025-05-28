import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './components/AuthContext';
import { GoalProvider, useGoals } from './context/GoalContext';
import RukminiChat from './components/RukminiChat';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

// Pages
import Dashboard from './components/Dashboard';
import BudgetForm from './components/BudgetForm';
import BudgetAnalytics from './components/BudgetAnalytics';
import FinancialPosition from './components/FinancialPosition';
import GoalTracker from './components/GoalTracker';
import MoodTracker from './components/MoodTracker';
import Profile from './components/Profile';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';

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
  const { user, isLoading, token } = useAuth();
  const location = useLocation();

  if (isLoading || (!user && token)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
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

// Main App content with layout
function AppContent() {
  const { user } = useAuth();
  const { goals } = useGoals();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  const isPublicPage = ["/home", "/", "/login", "/signup"].includes(location.pathname);

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
      {!isPublicPage && (
        <>
          <Sidebar ref={sidebarRef} isOpen={isSidebarOpen} />
          <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <RukminiChat />
        </>
      )}
      <main className={!isPublicPage ? "pl-64 pt-20 min-h-screen transition-all duration-300" : ""}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <div className="p-4">
              <Routes location={location} key={location.pathname}>
                {/* Public routes */}
                <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/budget-analytics" element={
                  <ProtectedRoute>
                    <BudgetAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/financial-position" element={
                  <ProtectedRoute>
                    <FinancialPosition />
                  </ProtectedRoute>
                } />
                <Route path="/mood" element={
                  <ProtectedRoute>
                    <MoodTracker />
                  </ProtectedRoute>
                } />
                <Route path="/goal-tracker" element={
                  <ProtectedRoute>
                    <GoalTracker />
                  </ProtectedRoute>
                } />

                {/* 404 fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
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
