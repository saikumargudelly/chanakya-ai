import React from 'react';
import AnimatedChanakya from './AnimatedChanakya';

export default function Home({ onLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex flex-col">
      <header className="w-full flex items-center justify-between px-8 py-6 bg-transparent">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow">Chanakya – AI Financial Wellness Coach</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-lg shadow-lg transition"
          onClick={onLogin}
        >
          Login
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <AnimatedChanakya className="mb-6" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Take Control of Your Financial Wellness</h2>
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl">
          Chanakya helps you track your income, expenses, mood, and goals—while offering personalized budgeting advice and emotional wellness insights, powered by AI.
        </p>
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-4xl mb-12">
          <FeatureCard emoji="💡" title="AI-Powered Guidance" desc="Get personalized financial advice and insights, tailored to your goals and habits." />
          <FeatureCard emoji="📊" title="Track & Analyze" desc="Easily log income, expenses, moods, and goals. Visualize your progress over time." />
          <FeatureCard emoji="🔒" title="Secure & Private" desc="Your data is protected with secure authentication and privacy best practices." />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <span className="text-white text-lg font-semibold">Ready to get started?</span>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition mt-2 md:mt-0"
            onClick={onLogin}
          >
            Sign In / Register
          </button>
        </div>
      </main>
      <footer className="w-full text-center text-blue-200 py-6 text-sm opacity-70 mt-8">
        &copy; {new Date().getFullYear()} Chanakya AI Financial Wellness Coach
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col items-center">
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="text-xl font-bold text-white mb-1">{title}</div>
      <div className="text-blue-100">{desc}</div>
    </div>
  );
}
