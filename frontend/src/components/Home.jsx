import React from 'react';
import AnimatedChanakya from './AnimatedChanakya';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogin = () => {
    console.log('Login button clicked');
    navigate('/login');
  };
  const handleSignup = () => {
    console.log('Signup button clicked');
    navigate('/signup');
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white flex flex-col overflow-hidden relative">
      {/* Optional: Add subtle background patterns or shapes */}
      <div className="absolute inset-0 z-0 opacity-30" style={{ 
        backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px), radial-gradient(#3b82f6 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
       }}></div>
      <header className="w-full flex items-center justify-between px-4 md:px-8 py-6 bg-transparent relative z-10">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">Chanakya – AI Financial Wellness Coach</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-md shadow-lg transition transform hover:scale-105"
          onClick={handleLogin}
        >
          Login
        </button>
        {user && (
          <button
            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-md shadow transition transform hover:scale-105"
            onClick={() => { logout(); navigate('/'); }}
          >
            Logout
          </button>
        )}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 py-12">
        <AnimatedChanakya className="mb-8 w-40 h-40 md:w-48 md:h-48" />
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow">Take Control of Your Financial Wellness</h2>
        <p className="text-md md:text-xl text-blue-200 mb-12 max-w-3xl leading-relaxed">
          Chanakya is your intelligent companion, guiding you towards financial peace of mind by helping you track income, manage expenses, understand your moods, and achieve your financial goals. Get personalized insights and emotional wellness support, powered by cutting-edge AI.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
          <FeatureCard emoji="💡" title="AI-Powered Guidance" desc="Receive personalized financial advice and insights tailored to your unique goals, spending habits, and emotional state for smarter financial decisions." />
          <FeatureCard emoji="📊" title="Track & Analyze" desc="Effortlessly log your income, expenses, moods, and financial goals. Visualize your progress with intuitive charts and reports to stay on track." />
          <FeatureCard emoji="🔒" title="Secure & Private" desc="Rest assured that your financial data is protected with industry-leading security protocols and privacy best practices. Your trust is our priority." />
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
          <span className="text-white text-xl font-semibold">Ready to transform your financial life?</span>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition transform hover:scale-105"
            onClick={handleSignup}
          >
            Sign Up for Free
          </button>
        </div>
      </main>
      <footer className="w-full text-center text-blue-200 py-6 text-sm opacity-80 relative z-10">
        &copy; {new Date().getFullYear()} Chanakya AI Financial Wellness Coach. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }) {
  return (
    <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white border-opacity-20 flex flex-col items-center text-center transition transform hover:-translate-y-2 hover:shadow-2xl">
      <div className="text-4xl mb-3 drop-shadow">{emoji}</div>
      <div className="text-xl font-bold text-white mb-2 drop-shadow">{title}</div>
      <div className="text-blue-200 text-md leading-relaxed">{desc}</div>
    </div>
  );
}
