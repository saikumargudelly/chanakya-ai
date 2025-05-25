import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './components/AuthContext';
import { GoalProvider, useGoals } from './context/GoalContext';
import RukminiChat from './components/RukminiChat';

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

// A wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  const { user, isLoading, token } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user but we have a token, we're still loading
  if (!user && token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// A wrapper for public-only routes (like login, signup)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is already authenticated, redirect to home or the intended page
  if (user) {
    return <Navigate to={from} replace />;
  }

  return children;
};

// Main App content with layout

function AppContent() {
  const { user } = useAuth();
  const { goals } = useGoals();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Determine if the current page is public (no layout)
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
    <>
      {/* Render layout only on protected (non-public) pages */}
      {!isPublicPage && (
        <>
          <Sidebar ref={sidebarRef} isOpen={isSidebarOpen} />
          <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <RukminiChat />
        </>
      )}
      <main className={!isPublicPage ? "pl-64 pt-20 min-h-screen bg-gray-50 dark:bg-gray-900" : ""}>
        <Routes>
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
          {/* Add more protected routes as needed */}

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
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
