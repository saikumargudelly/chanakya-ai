import React, { useState, useMemo } from 'react';
import { getPermaTipConversation } from '../services/permaChat';

// Pool of PERMA questions for daily randomization
const PERMA_QUESTIONS = [
  // Core 5
  {
    pillar: 'Positive Emotion',
    question: 'How have your overall emotions been today?',
    options: [
      { label: '😊 Mostly positive', value: 2 },
      { label: '😐 Neutral', value: 1 },
      { label: '😟 Mostly negative', value: 0 },
    ],
  },
  {
    pillar: 'Engagement',
    question: 'Did you feel deeply involved or focused in any activity?',
    options: [
      { label: '🧠 Yes, I was fully engaged', value: 2 },
      { label: '🤷‍♂️ A bit distracted but tried', value: 1 },
      { label: '😔 Not really', value: 0 },
    ],
  },
  {
    pillar: 'Relationships',
    question: 'Have you connected with friends, family, or anyone meaningfully?',
    options: [
      { label: '❤️ Yes, very much', value: 2 },
      { label: '👥 Somewhat', value: 1 },
      { label: '🙁 No, I felt isolated', value: 0 },
    ],
  },
  {
    pillar: 'Meaning',
    question: 'Did you do something today that felt meaningful or purposeful?',
    options: [
      { label: '🌟 Yes, definitely', value: 2 },
      { label: '🤔 I’m not sure', value: 1 },
      { label: '🕳️ No, nothing in particular', value: 0 },
    ],
  },
  {
    pillar: 'Accomplishment',
    question: 'Did you complete or make progress on any goal or task?',
    options: [
      { label: '✅ Yes, I accomplished something', value: 2 },
      { label: '📋 I started something', value: 1 },
      { label: '❌ No, I couldn’t get to it', value: 0 },
    ],
  },
  // Additional dynamic questions for variety
  {
    pillar: 'Positive Emotion',
    question: 'Did you laugh or smile today?',
    options: [
      { label: '😂 Many times', value: 2 },
      { label: '🙂 Once or twice', value: 1 },
      { label: '😐 Not really', value: 0 },
    ],
  },
  {
    pillar: 'Engagement',
    question: 'Did you lose track of time doing something enjoyable?',
    options: [
      { label: '🎨 Yes, totally!', value: 2 },
      { label: '⏳ Briefly', value: 1 },
      { label: '🕰️ Not at all', value: 0 },
    ],
  },
  {
    pillar: 'Relationships',
    question: 'Did you help or support someone today?',
    options: [
      { label: '🤝 Yes, I did', value: 2 },
      { label: '🙂 A little', value: 1 },
      { label: '🙅‍♂️ No', value: 0 },
    ],
  },
  {
    pillar: 'Meaning',
    question: 'Did you feel your actions contributed to something bigger?',
    options: [
      { label: '🌍 Absolutely', value: 2 },
      { label: '🤔 Maybe', value: 1 },
      { label: '🙅‍♂️ Not today', value: 0 },
    ],
  },
  {
    pillar: 'Accomplishment',
    question: 'Did you overcome a challenge today?',
    options: [
      { label: '💪 Yes, I did!', value: 2 },
      { label: '🙂 A small one', value: 1 },
      { label: '🙁 Not really', value: 0 },
    ],
  },
  // More questions can be added for further daily variety
];

// Helper to get a deterministic daily set of questions
function getTodaysQuestions(questionPool, min = 5, max = 8) {
  // Use date as a seed for deterministic shuffle
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  // Simple seeded shuffle
  let arr = [...questionPool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Pick a number of questions between min and max
  const numQuestions = min + (seed % (max-min+1));
  return arr.slice(0, numQuestions);
}

const PERMA_PILLARS = ['Positive Emotion', 'Engagement', 'Relationships', 'Meaning', 'Accomplishment'];

const MoodTracker = () => {
  // Dynamically pick 5-8 questions per day
  const todaysQuestions = useMemo(() => getTodaysQuestions(PERMA_QUESTIONS, 5, 8), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(todaysQuestions.length).fill(null));
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tipChat, setTipChat] = useState([]); // [{role: 'ai'|'user', text: string}]
  const [tipLoading, setTipLoading] = useState(false);
  const [tipInput, setTipInput] = useState('');
  const [showJournal, setShowJournal] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  // Carousel state for two-at-a-time
  const [visibleStart, setVisibleStart] = useState(0);
  const visibleCount = 2;
  const canGoLeft = visibleStart > 0;
  const canGoRight = visibleStart + visibleCount < todaysQuestions.length;
  const visibleQuestions = todaysQuestions.slice(visibleStart, visibleStart + visibleCount);

  const handleAnswer = (idx, optionValue) => {
    const updated = [...answers];
    updated[idx] = optionValue;
    setAnswers(updated);
  };

  const canProceed = answers[step] !== null;
  const allAnswered = answers.every(a => a !== null);

  const handleNext = () => {
    if (step < todaysQuestions.length - 1) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };
  const handleSubmit = () => {
    setShowAnalysis(true);
  };
  function resetInteraction() {
    setShowTip(false); setShowJournal(false); setShowGoal(false);
  }

  // Analyze answers by PERMA
  function analyzePERMA() {
    // Map answers to pillars
    let pillarScores = {};
    PERMA_PILLARS.forEach(p => pillarScores[p] = []);
    todaysQuestions.forEach((q, i) => {
      pillarScores[q.pillar].push(answers[i]);
    });
    // Average each pillar
    let avgScores = {};
    PERMA_PILLARS.forEach(p => {
      avgScores[p] = pillarScores[p].length ? (pillarScores[p].reduce((a,b) => a+b, 0) / pillarScores[p].length) : 0;
    });
    // Find strong and weak
    const sorted = Object.entries(avgScores).sort((a,b) => b[1]-a[1]);
    const strong = sorted[0][0];
    const weak = sorted[sorted.length-1][0];
    return { avgScores, strong, weak };
  }

  function getAnalysisMessage() {
    const { avgScores, strong, weak } = analyzePERMA();
    // Empathetic, natural response
    let msg = `From your answers, I see strong *${strong}*`;
    // If strong and weak are different, mention both
    if (strong !== weak) {
      msg += `, but a little dip in *${weak}*.`;
    }
    // Suggestion based on weak pillar
    let suggestion = '';
    switch (weak) {
      case 'Relationships':
        suggestion = 'Perhaps a quick call to a friend could help you feel more connected today.';
        break;
      case 'Meaning':
        suggestion = 'Maybe try a small act of kindness or reflect on what matters to you.';
        break;
      case 'Engagement':
        suggestion = 'Consider immersing yourself in a favorite hobby, even for a few minutes.';
        break;
      case 'Accomplishment':
        suggestion = 'Try setting a tiny goal and celebrating its completion.';
        break;
      case 'Positive Emotion':
        suggestion = 'How about listening to a favorite song or stepping outside for fresh air?';
        break;
      default:
        suggestion = 'Would you like a suggestion for something meaningful to do?';
    }
    // Add a friendly greeting to the start
    const intro = "Hey! Here's what I noticed from your check-in today: ";
    return `${intro}${msg} ${suggestion}`;
  }

  function getFinalEncouragement() {
    return `Small actions create big ripples, my friend. You’ve already taken the first one — self-reflection. Shall we try another quick goal or journal?`;
  }

  function getDynamicTip(weak) {
    switch (weak) {
      case 'Relationships':
        return "Reach out to someone you care about—even a short message can brighten both your days. Try a quick call or a kind text.";
      case 'Meaning':
        return "Reflect on what gives you purpose. Even a small act, like helping someone or learning something new, can add meaning to your day.";
      case 'Engagement':
        return "Try to immerse yourself in a favorite activity, even for just 5 minutes. Flow moments boost engagement and joy.";
      case 'Accomplishment':
        return "Set a tiny, achievable goal for today—like tidying your desk or finishing a small task. Celebrate your progress!";
      case 'Positive Emotion':
        return "Pause for a moment of gratitude or enjoy something simple—a song, a walk, or a deep breath. Positive feelings grow with attention.";
      default:
        return "Would you like a suggestion for something meaningful to do?";
    }
  }

  // UI
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-100 dark:border-gray-700 w-full mx-auto">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2 mb-3">
        <span>🧘‍♂️</span> Mood Tracker
      </h2>
      {step === 0 && !showAnalysis && (
        <div className="mb-6 text-lg font-medium text-gray-700 dark:text-gray-200 animate-fadeIn">
          Namaste. Let's do a quick self-check using <b>{todaysQuestions.length}</b> simple questions to understand your current state of well-being. Ready?
        </div>
      )}
      {showAnalysis && (
        <div className="animate-fadeIn flex flex-col gap-4 items-center">
          <div className="text-lg font-semibold mb-1 text-center">
            {getAnalysisMessage()}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={async ()=>{
                resetInteraction();
                setShowTip(true);
                setTipChat([]);
                setTipLoading(true);
                const { avgScores, strong, weak } = analyzePERMA();
                const perma_scores = avgScores;
                const summary = `Strongest pillar: ${strong}, weakest pillar: ${weak}. Answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(todaysQuestions.map(q => q.question))}`;
                const userMessage = '';
                const history = '';
                const aiResp = await getPermaTipConversation({ perma_scores, summary, userMessage, history });
                let tipText = aiResp.response;
                // Robustly parse if tipText is a stringified JSON or object
                if (typeof tipText === 'string') {
                  try {
                    const parsed = JSON.parse(tipText);
                    tipText = parsed.humanized || parsed.text || parsed.response || JSON.stringify(parsed);
                  } catch (e) {
                    // Not JSON, leave as is
                  }
                } else if (typeof tipText === 'object') {
                  tipText = tipText.humanized || tipText.text || tipText.response || JSON.stringify(tipText);
                }
                setTipChat([{role:'ai', text: tipText || 'No response from AI.'}]);
                setTipLoading(false);
              }}
              className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium hover:bg-blue-200"
            >
              Give me a tip
            </button>
            <button onClick={()=>{resetInteraction();setShowJournal(true);}} className="px-3 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium hover:bg-green-200">Start a journal</button>
            <button onClick={()=>{resetInteraction();setShowGoal(true);}} className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium hover:bg-yellow-200">Set a small goal</button>
          </div>
          {showTip && (
            <div className="mt-4 w-full flex flex-col items-center">
              {tipLoading && <div className="text-blue-500 animate-pulse">PERMA AI is thinking...</div>}
              {!tipLoading && tipChat.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4 max-w-xl w-full text-left mb-2 shadow">
                  {tipChat.map((msg, i) => (
                    <div key={i} className={msg.role === 'ai' ? 'text-blue-800 dark:text-blue-200 mb-2' : 'text-right text-gray-700 dark:text-gray-200 mb-2'}>
                      <span className="font-semibold">{msg.role === 'ai' ? 'PERMA AI: ' : 'You: '}</span>{msg.text}
                    </div>
                  ))}
                </div>
              )}
              {!tipLoading && tipChat.length > 0 && (
                <form
                  className="flex gap-2 w-full max-w-xl"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!tipInput.trim()) return;
                    setTipChat(c => [...c, {role:'user', text: tipInput}]);
                    setTipLoading(true);
                    // Send user follow-up to Groq model
                    const { avgScores, strong, weak } = analyzePERMA();
                    const perma_scores = avgScores;
                    const summary = `Strongest pillar: ${strong}, weakest pillar: ${weak}. Answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(todaysQuestions.map(q => q.question))}`;
                    const userMessage = tipInput;
                    const history = tipChat.map(msg => `${msg.role === 'ai' ? 'Chanakya' : 'User'}: ${msg.text}`).join('\n');
                    const aiResp = await getPermaTipConversation({ perma_scores, summary, userMessage, history });
                    let tipText = aiResp.response;
                    if (typeof tipText === 'string') {
                      try {
                        const parsed = JSON.parse(tipText);
                        tipText = parsed.humanized || parsed.text || parsed.response || JSON.stringify(parsed);
                      } catch (e) {
                        // Not JSON, leave as is
                      }
                    } else if (typeof tipText === 'object') {
                      tipText = tipText.humanized || tipText.text || tipText.response || JSON.stringify(tipText);
                    }
                    setTipChat(c => [...c, {role:'ai', text: tipText || 'No response from AI.'}]);
                    setTipInput('');
                    setTipLoading(false);
                  }}
                >
                  <input
                    className="flex-1 rounded-lg border px-3 py-2 dark:bg-gray-800 dark:text-white"
                    placeholder="Say something to PERMA AI..."
                    value={tipInput}
                    onChange={e => setTipInput(e.target.value)}
                    disabled={tipLoading}
                  />
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-40" disabled={tipLoading || !tipInput.trim()}>Send</button>
                </form>
              )}
            </div>
          )}
          {showJournal && (
            <div className="mt-2 text-green-700 dark:text-green-300 text-base text-center">Journaling helps clarify thoughts and emotions. Try writing a few lines about something that made you feel good or something you’d like to improve. 🌱</div>
          )}
          {showGoal && (
            <div className="mt-2 text-yellow-700 dark:text-yellow-300 text-base text-center">Pick one tiny thing you can do today—like a 5-min walk, a gratitude note, or a deep breath break. Small steps matter! 🚶‍♂️</div>
          )}
          <div className="mt-4 text-blue-700 dark:text-blue-300 font-medium text-center">
            {getFinalEncouragement()}
          </div>
        </div>
      )}
      {!showAnalysis && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-4 w-full">
            <button
              className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold shadow disabled:opacity-40"
              onClick={() => setVisibleStart(s => Math.max(0, s - visibleCount))}
              disabled={!canGoLeft}
              aria-label="Previous"
            >
              &larr;
            </button>
            <div className="flex flex-row w-full gap-6">
              {visibleQuestions.map((q, idx) => {
                const realIdx = visibleStart + idx;
                return (
                  <div
                    key={realIdx}
                    className={`flex-1 min-w-0 p-6 rounded-2xl border shadow-xl transition-transform duration-500 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:scale-105 hover:shadow-2xl ${step === realIdx ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-500 scale-105' : 'opacity-70'}`}
                    style={{animation: 'fadeIn 0.5s'}}
                  >
                    <div className="text-lg font-semibold mb-3">{q.question}</div>
                    <div className="flex flex-col gap-3 mb-3">
                      {q.options.map((opt, oidx) => (
                        <button
                          key={oidx}
                          className={`px-4 py-2 rounded-xl border font-semibold focus:outline-none shadow-sm transition-all duration-150 text-lg flex items-center gap-2 ${answers[realIdx] === opt.value ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
                          onClick={() => handleAnswer(realIdx, opt.value)}
                          disabled={step !== realIdx}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" disabled={realIdx===0} onClick={() => setStep(realIdx-1)}>&larr; Back</button>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Q{realIdx+1}/{todaysQuestions.length}</div>
                      <button className="text-xs px-2 py-1 rounded bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-white" disabled={realIdx===todaysQuestions.length-1} onClick={() => setStep(realIdx+1)}>&rarr; Next</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold shadow disabled:opacity-40"
              onClick={() => setVisibleStart(s => Math.min(todaysQuestions.length - visibleCount, s + visibleCount))}
              disabled={!canGoRight}
              aria-label="Next"
            >
              &rarr;
            </button>
          </div>
          <div className="flex justify-center mt-6 gap-4">
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow disabled:opacity-50"
              disabled={!allAnswered}
              onClick={handleSubmit}
            >
              See My Mood Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
