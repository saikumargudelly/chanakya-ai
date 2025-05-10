// Utility functions for goal calculations
export function calculateMonthlySaving(targetAmount, deadlineMonths) {
  return targetAmount / deadlineMonths;
}

export function calculateWeeklySaving(targetAmount, deadlineMonths) {
  return targetAmount / (deadlineMonths * 4);
}

export function calculateProgress(savedAmount, targetAmount) {
  return Math.min(100, (savedAmount / targetAmount) * 100);
}

// Simple confidence score: 100 if on track, lower if behind
export function calculateConfidenceScore(savedAmount, targetAmount, monthsPassed, deadlineMonths) {
  const expectedSaved = (targetAmount / deadlineMonths) * monthsPassed;
  if (savedAmount >= expectedSaved) return 100;
  return Math.max(10, (savedAmount / expectedSaved) * 100);
}

export function getMilestone(progress) {
  if (progress >= 100) return '🎉 Goal Achieved!';
  if (progress >= 75) return 'Great job! 75% milestone reached!';
  if (progress >= 50) return 'Halfway there! 50% milestone reached!';
  if (progress >= 25) return 'Nice! 25% milestone reached!';
  return '';
}
