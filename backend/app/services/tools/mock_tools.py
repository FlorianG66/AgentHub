import datetime
from typing import Dict, Any

class LinkedInTool:
    """
    Connecteur LinkedIn (Mock extensible vers l'API officielle LinkedIn).
    Permet aux agents d'interroger les performances et de soumettre des publications.
    """
    @staticmethod
    def get_last_post_metrics() -> Dict[str, Any]:
        return {
            "post_id": "urn:li:share:7241908234",
            "published_at": (datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat(),
            "impressions": 1420,
            "reactions": 68,
            "comments": 14,
            "shares": 7,
            "engagement_rate": "4.8%",
            "top_reaction": "LIKE"
        }

    @staticmethod
    def format_for_publishing(content: str, hashtags: list, scheduled_time: str = None) -> Dict[str, Any]:
        return {
            "platform": "LinkedIn",
            "text": content,
            "hashtags": hashtags,
            "scheduled_time": scheduled_time or (datetime.datetime.utcnow() + datetime.timedelta(days=1)).strftime("%Y-%m-%d 09:00:00 UTC")
        }

class AnalyticsTool:
    """
    Outil d'agrégation d'audiences et de performances statistiques.
    """
    @staticmethod
    def get_audience_summary() -> Dict[str, Any]:
        return {
            "total_followers": 2840,
            "growth_last_30_days": "+12%",
            "best_performing_time": "Mardi 09:00",
            "top_interest": "Artisanat, Commerce local, Qualité produit"
        }
