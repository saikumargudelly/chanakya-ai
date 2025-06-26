from typing import List, Dict, Any
from datetime import datetime, timedelta

PERMA_PILLARS = [
    'Positive Emotion',
    'Engagement',
    'Relationships',
    'Meaning',
    'Accomplishment'
]

PERMA_SUGGESTIONS = {
    'Positive Emotion': [
        "Try a gratitude exercise: write down three things you're grateful for.",
        "Listen to your favorite uplifting music.",
        "Spend time outdoors or in nature if possible."
    ],
    'Engagement': [
        "Do an activity that fully absorbs you (reading, art, coding, etc.).",
        "Set aside time for a hobby you enjoy.",
        "Try a new challenge that interests you."
    ],
    'Relationships': [
        "Reach out to a friend or loved one for a chat.",
        "Express appreciation to someone you care about.",
        "Join a group or community activity."
    ],
    'Meaning': [
        "Reflect on what gives your life purpose.",
        "Do something kind for someone else.",
        "Spend time on an activity that feels important to you."
    ],
    'Accomplishment': [
        "Set a small, achievable goal for today.",
        "Celebrate a recent success, no matter how small.",
        "Make a to-do list and check off completed tasks."
    ]
}

def calculate_perma_scores(answers: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calculate average PERMA scores from a list of answers.
    Each answer should be a dict with at least 'pillar' and 'score' keys.
    Returns a dict of pillar -> average score (0-10 scale), and 'overall'.
    """
    pillar_scores = {pillar: [] for pillar in PERMA_PILLARS}
    for ans in answers:
        pillar = ans.get('pillar')
        score = ans.get('score')
        if pillar in pillar_scores and score is not None:
            try:
                score = float(score)
            except Exception:
                continue
            pillar_scores[pillar].append(score)
    avg_scores = {}
    total_score = 0
    total_pillars = 0
    for pillar in PERMA_PILLARS:
        scores = pillar_scores[pillar]
        if scores:
            avg = sum(scores) / len(scores)
            avg_10 = round(avg * 5, 1)  # Convert 0-2 scale to 0-10
            avg_scores[pillar] = avg_10
            total_score += avg_10
            total_pillars += 1
        else:
            avg_scores[pillar] = 0.0
    overall = round(total_score / total_pillars, 1) if total_pillars > 0 else 0.0
    avg_scores['overall'] = overall
    return avg_scores

def analyze_mood_trends(sessions: List[Any], days: int = 7) -> Dict[str, Dict[str, Any]]:
    """
    Analyze PERMA trends over the last N days from a list of mood sessions.
    Each session should have 'perma_scores' (dict) and 'timestamp' (datetime).
    Returns a dict of pillar -> { 'trend': 'improving'|'declining'|'stable', 'scores': [...] }
    """
    import numpy as np
    cutoff = datetime.utcnow() - timedelta(days=days)
    pillar_history = {pillar: [] for pillar in PERMA_PILLARS}
    for session in sessions:
        ts = session.timestamp if hasattr(session, 'timestamp') else session.get('timestamp')
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        if ts < cutoff:
            continue
        scores = session.perma_scores if hasattr(session, 'perma_scores') else session.get('perma_scores', {})
        for pillar in PERMA_PILLARS:
            val = scores.get(pillar)
            if val is not None:
                try:
                    val = float(val)
                except Exception:
                    continue
                pillar_history[pillar].append((ts, val))
    trends = {}
    for pillar, history in pillar_history.items():
        if len(history) < 2:
            trends[pillar] = {'trend': 'stable', 'scores': [v for _, v in history]}
            continue
        # Sort by timestamp
        history.sort()
        scores = [v for _, v in history]
        # Simple trend: compare first and last
        if scores[-1] > scores[0]:
            trend = 'improving'
        elif scores[-1] < scores[0]:
            trend = 'declining'
        else:
            trend = 'stable'
        trends[pillar] = {'trend': trend, 'scores': scores}
    return trends

def get_perma_suggestions(pillar: str) -> List[str]:
    """
    Return a list of suggestions for a given PERMA pillar.
    """
    return PERMA_SUGGESTIONS.get(pillar, []) 