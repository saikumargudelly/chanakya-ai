from datetime import datetime, timedelta
from typing import Dict, List, Any

def calculate_perma_scores(answers: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate PERMA scores from mood session answers."""
    pillar_scores = {
        'Positive Emotion': [],
        'Engagement': [],
        'Relationships': [],
        'Meaning': [],
        'Accomplishment': []
    }
    
    # Group scores by pillar
    for answer in answers:
        pillar = answer.get('pillar')
        raw_score = answer.get('rawScore')
        if pillar and raw_score is not None:
            pillar_scores[pillar].append(raw_score)
    
    # Calculate average for each pillar
    avg_scores = {}
    total_score = 0
    total_pillars = 0
    
    for pillar, scores in pillar_scores.items():
        if scores:
            avg = sum(scores) / len(scores)
            avg_scores[pillar] = round(avg, 2)
            total_score += avg
            total_pillars += 1
        else:
            avg_scores[pillar] = 0
    
    # Calculate overall score
    if total_pillars > 0:
        avg_scores['Overall Score'] = round((total_score / total_pillars) * 5, 1)
    else:
        avg_scores['Overall Score'] = 0
    
    return avg_scores

def analyze_mood_trends(sessions: List[Dict[str, Any]], days: int = 7) -> Dict[str, Any]:
    """Analyze mood trends from historical sessions."""
    if not sessions:
        return {}
        
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent_sessions = [
        s for s in sessions 
        if datetime.fromisoformat(s['timestamp'].replace('Z', '+00:00')) > cutoff
    ]
    
    if not recent_sessions:
        return {}
    
    pillars = ['Positive Emotion', 'Engagement', 'Relationships', 'Meaning', 'Accomplishment']
    trends = {}
    
    for pillar in pillars:
        scores = [s['perma_scores'].get(pillar, 0) for s in recent_sessions]
        if len(scores) >= 2:
            trend = scores[-1] - scores[0]  # Compare latest to earliest
            improvement = trend > 0.2
            decline = trend < -0.2
            consistency = max(scores) - min(scores) < 0.5
            avg = sum(scores) / len(scores)
            
            trends[pillar] = {
                'trend': 'improving' if improvement else 'declining' if decline else 'stable',
                'average': round(avg, 2),
                'consistency': consistency,
                'improvement': improvement
            }
    
    return trends

def get_perma_suggestions(weak_pillar: str) -> List[str]:
    """Get personalized suggestions based on weak PERMA pillar."""
    suggestions = {
        'relationships': [
            'Consider reaching out to a friend or loved one today. Even a quick message can strengthen your connection.',
            'Social connections thrive on quality time. Could you schedule a coffee chat or phone call with someone important to you?',
            'Who in your life could use some extra support right now? Reaching out benefits both of you.'
        ],
        'meaning': [
            'Reflect on what gives your life purpose. What activities or values feel most meaningful to you?',
            'Consider volunteering or helping someone today. Even small acts can create a sense of purpose.',
            'Journal about what truly matters to you. What legacy would you like to create?'
        ],
        'engagement': [
            'What activity makes you lose track of time? Schedule time for it today.',
            'Try a new hobby or skill that challenges you just the right amount.',
            'Break down a complex task into smaller, more engaging chunks.'
        ],
        'accomplishment': [
            'Set a small, achievable goal for today. Celebrate when you complete it!',
            'What\'s one task you\'ve been putting off? Commit to working on it for just 5 minutes.'
        ],
        'positive emotion': [
            'Practice gratitude: list three things you\'re thankful for right now.',
            'Take a mindful moment to appreciate something beautiful around you.'
        ]
    }
    
    pillar = weak_pillar.lower().replace(' ', '_')
    return suggestions.get(pillar, [
        'What\'s one small thing you could do today to take care of yourself?'
    ])