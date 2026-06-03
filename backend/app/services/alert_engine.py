from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable

@dataclass
class Alert:
    name: str
    reason: str 
    severity: str
    stats: dict[str, Any]
    logs: list[dict[str, Any]] = field(default_factory=list) # the logs that caused this alert


class Rule:
    def evaluate(self, logs: list[dict[str, Any]]) -> list[Alert]:
        raise NotImplementedError("Rules must implement evaluate()")

    def _parse_time(self, log_time_str: str) -> datetime | None:
        try:
            return datetime.fromisoformat(log_time_str)
        except (ValueError, TypeError):
            return None


class ErrorCountRule(Rule):
    """
    Alerts if ERROR count > threshold in the specified time window (minutes).
    """
    def __init__(self, time_window_minutes: int = 10, threshold: int = 5):
        self.time_window_minutes = time_window_minutes
        self.threshold = threshold
        self.name = "High Error Rate"

    def evaluate(self, logs: list[dict[str, Any]]) -> list[Alert]:
        alerts = []
        
        # Filter for ERROR logs only and parse times
        error_logs = []
        for log in logs:
            if log.get("level") == "ERROR":
                time_str = log.get("date", "") + "T" + log.get("time", "") if log.get("date") and log.get("time") else log.get("timestamp", "")
                dt = self._parse_time(time_str)
                if dt:
                    error_logs.append((dt, log))
                    
        # Sort chronologically
        error_logs.sort(key=lambda x: x[0])
        
        # Rolling window evaluation
        for i, (end_time, _) in enumerate(error_logs):
            window_logs = []
            for j in range(i, -1, -1):
                start_time, log = error_logs[j]
                delta = end_time - start_time
                if delta.total_seconds() / 60.0 <= self.time_window_minutes:
                    window_logs.append(log)
                else:
                    break
                    
            if len(window_logs) >= self.threshold:
                # To prevent spamming alerts for the exact same window,
                # we only fire if this specific log tips the threshold.
                if len(window_logs) == self.threshold:
                    reason = f"Exceeded {self.threshold} ERROR logs within {self.time_window_minutes} minutes."
                    alerts.append(
                        Alert(
                            name=self.name,
                            reason=reason,
                            severity="HIGH",
                            stats={
                                "count": len(window_logs),
                                "time_window_minutes": self.time_window_minutes,
                                "latest_timestamp": end_time.isoformat()
                            },
                            logs=window_logs
                        )
                    )
        return alerts


class KeywordMatchRule(Rule):
    """
    Alerts if a specific keyword appears > threshold times in a time window.
    """
    def __init__(self, keyword: str, time_window_minutes: int = 10, threshold: int = 5):
        self.keyword = keyword
        self.time_window_minutes = time_window_minutes
        self.threshold = threshold
        self.name = f"Frequent Keyword: '{keyword}'"

    def evaluate(self, logs: list[dict[str, Any]]) -> list[Alert]:
        alerts = []
        
        keyword_logs = []
        for log in logs:
            message = str(log.get("message", ""))
            if self.keyword in message:
                time_str = log.get("date", "") + "T" + log.get("time", "") if log.get("date") and log.get("time") else log.get("timestamp", "")
                dt = self._parse_time(time_str)
                if dt:
                    keyword_logs.append((dt, log))
                    
        keyword_logs.sort(key=lambda x: x[0])
        
        for i, (end_time, _) in enumerate(keyword_logs):
            window_logs = []
            for j in range(i, -1, -1):
                start_time, log = keyword_logs[j]
                delta = end_time - start_time
                if delta.total_seconds() / 60.0 <= self.time_window_minutes:
                    window_logs.append(log)
                else:
                    break
                    
            if len(window_logs) >= self.threshold:
                if len(window_logs) == self.threshold:
                    reason = f"Keyword '{self.keyword}' seen {self.threshold} times within {self.time_window_minutes} minutes."
                    alerts.append(
                        Alert(
                            name=self.name,
                            reason=reason,
                            severity="MEDIUM" if self.threshold < 10 else "HIGH",
                            stats={
                                "count": len(window_logs),
                                "time_window_minutes": self.time_window_minutes,
                                "latest_timestamp": end_time.isoformat()
                            },
                            logs=window_logs
                        )
                    )
        return alerts


class AlertRuleEngine:
    def __init__(self, rules: list[Rule]):
        self.rules = rules

    def evaluate(self, logs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        all_alerts = []
        for rule in self.rules:
            alerts = rule.evaluate(logs)
            for alert in alerts:
                # Convert dataclass to dict for JSON serialization
                all_alerts.append({
                    "name": alert.name,
                    "severity": alert.severity,
                    "reason": alert.reason,
                    "stats": alert.stats,
                    "logs": alert.logs
                })
        return all_alerts
