// Helper to get a deterministic daily set of questions (5-6 questions per day)
export function getTodaysQuestions(questionPool) {
  // Use date as a seed for deterministic shuffle
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Group questions by pillar
  const questionsByPillar = {};
  questionPool.forEach(q => {
    if (!questionsByPillar[q.pillar]) {
      questionsByPillar[q.pillar] = [];
    }
    questionsByPillar[q.pillar].push(q);
  });

  // Select 1 question from each pillar
  let selectedQuestions = [];
  Object.keys(questionsByPillar).forEach(pillar => {
    const pillarQuestions = [...questionsByPillar[pillar]];
    // Simple seeded shuffle for this pillar's questions
    for (let i = pillarQuestions.length - 1; i > 0; i--) {
      const j = (seed + i * 31) % (i + 1);
      [pillarQuestions[i], pillarQuestions[j]] = [pillarQuestions[j], pillarQuestions[i]];
    }
    selectedQuestions.push(pillarQuestions[0]);
  });

  // Add 1-2 additional random questions for variety
  const remainingQuestions = questionPool.filter(q => !selectedQuestions.includes(q));
  const numExtra = 1 + (seed % 2); // 1 or 2 extra questions
  
  for (let i = 0; i < numExtra && remainingQuestions.length > 0; i++) {
    const randomIndex = (seed * (i + 1)) % remainingQuestions.length;
    selectedQuestions.push(remainingQuestions[randomIndex]);
    remainingQuestions.splice(randomIndex, 1);
  }

  // Final shuffle of selected questions
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  return selectedQuestions;
}

// Analyze answers by PERMA
export function analyzePERMA(answers, questions, PERMA_PILLARS) {
  // Map answers to pillars
  let pillarScores = {};
  PERMA_PILLARS.forEach(p => pillarScores[p] = []);
  
  // Group answers by pillar
  questions.forEach((q, i) => {
    if (answers[i] !== null) { // Only include answered questions
      pillarScores[q.pillar].push(answers[i]);
    }
  });
  
  // Calculate average score for each pillar (convert to 0-10 scale)
  let avgScores = {};
  let totalScore = 0;
  let totalPillars = 0;
  
  PERMA_PILLARS.forEach(p => {
    if (pillarScores[p].length > 0) {
      // Calculate average for this pillar (0-2 scale) then convert to 0-10
      const sum = pillarScores[p].reduce((a, b) => a + b, 0);
      const avg = sum / pillarScores[p].length;
      avgScores[p] = parseFloat((avg * 5).toFixed(1)); // Convert to 0-10 scale
      totalScore += avgScores[p];
      totalPillars++;
    } else {
      avgScores[p] = 0; // Default to 0 if no questions answered for this pillar
    }
  });
  
  // Calculate overall PERMA score (average of all pillar scores on 0-10 scale)
  const overallScore = totalPillars > 0 ? parseFloat((totalScore / totalPillars).toFixed(1)) : 0;
  
  // Find strong and weak pillars (only consider pillars with answers)
  const pillarsWithAnswers = Object.entries(avgScores)
    .filter(([_, score]) => score > 0);
    
  let weak = 'Positive Emotion';
  
  if (pillarsWithAnswers.length > 0) {
    // Sort by score to find strongest and weakest
    const sorted = [...pillarsWithAnswers].sort((a, b) => b[1] - a[1]);
    weak = sorted[sorted.length - 1][0];
    
    // If all scores are equal, don't highlight any as weak
    if (sorted[0][1] === sorted[sorted.length - 1][1]) {
      weak = '';
    }
  }
  
  return { 
    avgScores, 
    weak,
    overallScore: parseFloat(overallScore.toFixed(1)) // 0-10 scale
  };
}

// Get description for a pillar based on score (0-10 scale)
export function getPillarDescription(pillar, score, descriptions) {
  const level = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
  return descriptions[pillar]?.[level] || '';
}

// Helper to convert 0-2 score to 0-10 scale
export function getScoreOutOf10(score) {
  return Math.round(score * 5);
}

// Get emoji for score (0-10 scale)
export function getScoreEmoji(score) {
  const score10 = getScoreOutOf10(score);
  if (score10 >= 9) return '🌟';
  if (score10 >= 7) return '😊';
  if (score10 >= 5) return '😐';
  if (score10 >= 3) return '😕';
  return '😞';
}

// Get score description
export function getScoreDescription(score) {
  const score10 = getScoreOutOf10(score);
  if (score10 >= 9) return 'Excellent';
  if (score10 >= 7) return 'Good';
  if (score10 >= 5) return 'Average';
  if (score10 >= 3) return 'Below average';
  return 'Needs attention';
}