import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, TrendingUp, Heart, Target, DollarSign, Brain, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import throttle from 'lodash.throttle';

const ChanakyaHomepage = () => {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresRef = useRef(null);

  const features = [
    {
      title: "Budget Tracker",
      subtitle: "Smart Financial Management",
      description: "Track your income and expenses with intelligent categorization. Get personalized budgeting advice and real-time financial insights to optimize your spending habits.",
      icon: <TrendingUp className="w-8 h-8" />,
      stats: ["₹50L+ Tracked", "95% Accuracy", "Real-time Updates"]
    },
    {
      title: "Mood Tracker", 
      subtitle: "Emotional Wellness Monitoring",
      description: "Monitor your emotional state with PERMA-based wellness assessment. Understand how your mood affects your financial decisions and get personalized wellness recommendations.",
      icon: <Heart className="w-8 h-8" />,
      stats: ["Daily Tracking", "PERMA Based", "Mood Analytics"]
    },
    {
      title: "Goal Tracker",
      subtitle: "Achievement & Progress Monitoring", 
      description: "Set and track your financial goals with AI-powered insights. Monitor your progress, get milestone celebrations, and receive adaptive strategies to achieve your dreams.",
      icon: <Target className="w-8 h-8" />,
      stats: ["Smart Goals", "Progress Insights", "Achievement System"]
    }
  ];

  // Handle scroll/swipe to change feature
  const handleGesture = useCallback(throttle((deltaY) => {
    setActiveFeature(prev => {
      if (deltaY > 0) { // Scrolling/Swiping down
        // Loop from last card to first
        return (prev === features.length - 1) ? 0 : prev + 1;
      } else if (deltaY < 0) { // Scrolling/Swiping up
        // Loop from first card to last
        return (prev === 0) ? features.length - 1 : prev - 1;
      }
      return prev; // No change
    });
  }, 2000), [features.length]); // Increased throttle duration significantly

  useEffect(() => {
    const container = featuresRef.current;
    if (container) {
      const handleWheel = (e) => {
        // Prevent default vertical scrolling unless it's horizontal scrolling
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
           e.preventDefault(); 
           handleGesture(e.deltaY);
        }
      };

      let touchStartY = 0;
      let touchStartX = 0; // Added for detecting dominant scroll direction
      const handleTouchStart = (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      };
      const handleTouchMove = (e) => {
        if (touchStartY === 0) return; // Only process if touch started
        
        const touchEndY = e.touches[0].clientY;
        const touchEndX = e.touches[0].clientX;
        const deltaY = touchStartY - touchEndY;
        const deltaX = touchStartX - touchEndX;

        // Check if vertical movement is dominant and exceeds threshold
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 20) { // Reduced threshold slightly
           e.preventDefault(); // Prevent default touch scrolling once vertical swipe detected
           handleGesture(deltaY);
           // Reset touch start points after handling gesture
           touchStartY = 0; 
           touchStartX = 0;
        }
      };
      const handleTouchEnd = () => {
         // Reset touch start points on touch end
         touchStartY = 0; 
         touchStartX = 0;
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleGesture]);

  // Function to set active feature for dot navigation with a slight delay
  const navigateToFeature = (index) => {
    // Add a small delay to allow potential rendering updates before transition
    setTimeout(() => {
      setActiveFeature(index);
    }, 10); // Small delay of 10ms
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 text-white flex flex-col overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Financial chart silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-800/50 to-transparent">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
            <path d="M0,300 L0,180 Q200,120 400,140 T800,100 Q1000,80 1200,120 L1200,300 Z" fill="rgba(15, 23, 42, 0.6)"/>
            <path d="M0,300 L0,220 Q300,180 600,200 T1200,160 L1200,300 Z" fill="rgba(15, 23, 42, 0.4)"/>
          </svg>
        </div>
        
        {/* Aurora-like glow effects */}
        <div className="absolute top-1/3 left-1/4 w-96 h-32 bg-gradient-to-r from-teal-500/20 to-cyan-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-80 h-24 bg-gradient-to-r from-blue-500/15 to-teal-500/25 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        {/* Subtle stars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${10 + Math.random() * 40}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-50 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-500 rounded transform rotate-45 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm transform -rotate-45">₹</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-wide">CHANAKYA</h1>
              <p className="text-slate-400 text-xs tracking-wider">AI FINANCIAL WELLNESS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white hover:text-teal-400 transition-colors font-medium border-b-2 border-teal-400 pb-1">Home</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">About</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Tips</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Gallery</a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors">Contact</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
          <button
            onClick={() => { handleLogout(); navigate('/'); }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-md shadow transition transform hover:scale-105"
          >
            Logout
          </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold text-md shadow transition transform hover:scale-105"
              >
                Login
          </button>
        )}
          </div>
        </div>
      </nav>

      {/* Clickable Feature Dots - Right side */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center space-y-4">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => navigateToFeature(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeFeature === index 
                ? 'bg-teal-400 scale-125' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to feature ${index + 1}`}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 md:px-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Big Title and Project Motto */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight tracking-tight">
              Mastering
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-400 bg-clip-text text-transparent">
                Financial Wellness
              </span>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Journey to the pinnacle of financial enlightenment and witness the 
              <span className="text-teal-400"> AI-powered guidance</span>, 
              where ancient wisdom meets modern technology to transform your 
              financial wellbeing and ignite your wealth imagination.
            </p>
          </div>

          {/* Feature Line Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent w-full max-w-3xl"></div>
            </div>
            
            {/* Simple Feature Icons */}
            <div className="flex justify-center items-center space-x-10">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-teal-400" />
                </div>
                <span className="text-slate-300 text-xs md:text-sm text-center">Budget Tracking</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <Heart className="w-6 h-6 md:w-7 md:h-7 text-teal-400" />
                </div>
                <span className="text-slate-300 text-xs md:text-sm text-center">Mood Tracking</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <Target className="w-6 h-6 md:w-7 md:h-7 text-teal-400" />
                </div>
                <span className="text-slate-300 text-xs md:text-sm text-center">Goal Tracking</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <Brain className="w-6 h-6 md:w-7 md:h-7 text-teal-400" />
                </div>
                <span className="text-slate-300 text-xs md:text-sm text-center">AI Coaching</span>
              </div>
            </div>
          </div>

          {/* Feature Description Cards Container */}
          <div 
            ref={featuresRef}
            className="relative h-[240px] overflow-hidden mx-auto max-w-4xl flex items-start justify-center mt-0"
          >
            <div 
              className="absolute top-0 left-0 w-full transition-transform duration-[2000ms] ease-in-out"
              style={{ transform: `translateY(-${activeFeature * 240}px)` }}
            >
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="w-full h-[240px] flex items-center justify-center px-4 py-1"
                >
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 w-full max-w-3xl flex flex-col items-center text-center md:flex-row md:text-left md:items-start">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0 mb-3 md:mb-0 md:mr-5">
                      {feature.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                        {feature.title}
                      </h2>
                      <h3 className="text-sm md:text-base text-teal-400 mb-2 font-medium">
                        {feature.subtitle}
                      </h3>
                      <p className="text-slate-300 leading-relaxed mb-3 text-sm md:text-base">
                        {feature.description}
                      </p>
                      
                      <div className="flex justify-center md:justify-start space-x-4 md:space-x-5 text-xs md:text-sm">
                        {feature.stats.map((stat, index) => (
                          <div key={index} className="flex flex-col items-center md:items-start">
                            <div className="text-teal-400 font-bold">{stat}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-10">
            <button 
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-lg px-10 py-3 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              GET STARTED
          </button>
          </div>
        </div>
      </main>

      {/* Custom Styles */}
      <style>{`
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
        }
        
        .backdrop-blur-lg {
          backdrop-filter: blur(16px);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default ChanakyaHomepage;
