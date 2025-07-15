export const PERMA_PILLARS = ['Positive Emotion', 'Engagement', 'Relationships', 'Meaning', 'Accomplishment'];

// Expanded set of PERMA questions
export const PERMA_QUESTIONS = [
  // Positive Emotion Questions
  {
    pillar: 'Positive Emotion',
    question: 'What best describes your emotional landscape today?',
    options: [
      { label: '🌞 Mostly positive and uplifting', value: 2 },
      { label: '🌤️ Generally good with some ups and downs', value: 1.5 },
      { label: '🌥️ Neutral - neither particularly good nor bad', value: 1 },
      { label: '🌧️ More challenging than usual', value: 0.5 },
      { label: '🌪️ Really difficult day', value: 0 },
    ]
  },
  {
    pillar: 'Positive Emotion',
    question: 'How often did you experience positive emotions today?',
    options: [
      { label: '😊 Very frequently throughout the day', value: 2 },
      { label: '🙂 Several times today', value: 1.5 },
      { label: '😐 Occasionally', value: 1 },
      { label: '😕 Rarely', value: 0.5 },
      { label: '😞 Hardly at all', value: 0 },
    ]
  },
  
  // Engagement Questions
  {
    pillar: 'Engagement',
    question: 'How absorbed were you in your activities today?',
    options: [
      { label: 'Completely absorbed, lost track of time', value: 2 },
      { label: 'Very engaged most of the time', value: 1.5 },
      { label: 'Somewhat engaged', value: 1 },
      { label: 'Rarely engaged', value: 0.5 },
      { label: 'Felt disengaged', value: 0 },
    ]
  },
  {
    pillar: 'Engagement',
    question: 'How often did you experience flow states today?',
    options: [
      { label: 'Multiple times, felt in the zone', value: 2 },
      { label: 'Once or twice', value: 1.5 },
      { label: 'Brief moments', value: 1 },
      { label: 'Almost never', value: 0.5 },
      { label: 'Not at all', value: 0 },
    ]
  },
  
  // Relationships Questions
  {
    pillar: 'Relationships',
    question: 'How connected do you feel to others today?',
    options: [
      { label: 'Very connected and supported', value: 2 },
      { label: 'Fairly connected', value: 1.5 },
      { label: 'Neutral', value: 1 },
      { label: 'Somewhat disconnected', value: 0.5 },
      { label: 'Very isolated', value: 0 },
    ]
  },
  {
    pillar: 'Relationships',
    question: 'How satisfied are you with your social interactions today?',
    options: [
      { label: 'Extremely satisfied', value: 2 },
      { label: 'Quite satisfied', value: 1.5 },
      { label: 'Moderately satisfied', value: 1 },
      { label: 'Slightly dissatisfied', value: 0.5 },
      { label: 'Very dissatisfied', value: 0 },
    ]
  },
  
  // Meaning Questions
  {
    pillar: 'Meaning',
    question: 'How meaningful did your activities feel today?',
    options: [
      { label: 'Extremely meaningful', value: 2 },
      { label: 'Very meaningful', value: 1.5 },
      { label: 'Moderately meaningful', value: 1 },
      { label: 'Slightly meaningful', value: 0.5 },
      { label: 'Not at all meaningful', value: 0 },
    ]
  },
  {
    pillar: 'Meaning',
    question: 'How connected do you feel to something greater than yourself?',
    options: [
      { label: 'Very connected', value: 2 },
      { label: 'Fairly connected', value: 1.5 },
      { label: 'Somewhat connected', value: 1 },
      { label: 'Slightly connected', value: 0.5 },
      { label: 'Not at all connected', value: 0 },
    ]
  },
  
  // Accomplishment Questions
  {
    pillar: 'Accomplishment',
    question: 'How productive were you today?',
    options: [
      { label: 'Extremely productive', value: 2 },
      { label: 'Very productive', value: 1.5 },
      { label: 'Moderately productive', value: 1 },
      { label: 'Slightly productive', value: 0.5 },
      { label: 'Not productive at all', value: 0 },
    ]
  },
  {
    pillar: 'Accomplishment',
    question: 'How well did you make progress toward your goals today?',
    options: [
      { label: 'Made excellent progress', value: 2 },
      { label: 'Made good progress', value: 1.5 },
      { label: 'Made some progress', value: 1 },
      { label: 'Made little progress', value: 0.5 },
      { label: 'Made no progress', value: 0 },
    ]
  }
];

export const PERMA_DESCRIPTIONS = {
  'Positive Emotion': {
    high: 'You\'re experiencing many positive emotions. Keep doing what brings you joy!',
    medium: 'Your positive emotions are at a moderate level. What could bring you more joy today?',
    low: 'You might be feeling fewer positive emotions. Consider activities that usually lift your mood.'
  },
  'Engagement': {
    high: 'You\'re fully engaged in your activities. Keep finding those flow states!',
    medium: 'You have moderate engagement. Look for activities that fully capture your attention.',
    low: 'You might be feeling disengaged. Try activities that challenge and interest you.'
  },
  'Relationships': {
    high: 'Your relationships are strong and supportive. Nurture these connections!',
    medium: 'Your relationships could use more attention. Consider reaching out to someone today.',
    low: 'You might be feeling disconnected. Even small social interactions can help.'
  },
  'Meaning': {
    high: 'You feel a strong sense of purpose. Your life has deep meaning and direction.',
    medium: 'You have some sense of meaning. Reflect on what truly matters to you.',
    low: 'You might be searching for more meaning. Consider what gives your life purpose.'
  },
  'Accomplishment': {
    high: 'You\'re achieving your goals and feeling capable. Celebrate your progress!',
    medium: 'You\'re making steady progress. Keep setting and working toward your goals.',
    low: 'You might be feeling less accomplished. Start with small, achievable goals.'
  }
};