import React, { useState, useEffect, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import Profile from '../common/Profile';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
    </div>
  </div>
);

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Performance optimization: Memoize sidebar and topnav
  const MemoizedSidebar = React.memo(Sidebar);
  const MemoizedTopNav = React.memo(TopNav);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ErrorBoundary>
        <MemoizedSidebar isOpen={isSidebarOpen} isMobile={isMobile} />
        <MemoizedTopNav 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          setShowProfile={setShowProfile}
        />
        {/* Pass setShowProfile as onProfileClick to UserDropdown if used here */}
        {/* <UserDropdown onProfileClick={() => setShowProfile(true)} /> */}
        {showProfile && <Profile onClose={() => setShowProfile(false)} />}
        <main className={`transition-all duration-300 ${
          isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
        } pt-16`}>
          <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingSpinner />}>
              <PageTransition>
                <div className="p-4">{children}</div>
              </PageTransition>
            </Suspense>
          </AnimatePresence>
        </main>
      </ErrorBoundary>
    </div>
  );
};

export default React.memo(Layout);