"""
Context Manager - Manages conversation context and memory for AI agents
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from collections import deque


@dataclass
class ContextEntry:
    """A single entry in the context history"""
    timestamp: datetime
    entry_type: str  # 'observation', 'action', 'result', 'issue'
    content: Dict[str, Any]
    page_url: Optional[str] = None
    importance: float = 1.0  # For prioritizing what to keep


@dataclass
class ConversationTurn:
    """A single turn in the AI conversation"""
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    token_count: int = 0


class ContextManager:
    """
    Manages context and memory for AI testing agents.
    
    Features:
    - Maintains conversation history with token limits
    - Tracks page visits and actions
    - Provides relevant context for prompts
    - Implements sliding window with importance-based retention
    """
    
    def __init__(
        self,
        max_history_entries: int = 100,
        max_conversation_turns: int = 20,
        max_context_tokens: int = 8000
    ):
        """
        Initialize the context manager.
        
        Args:
            max_history_entries: Maximum entries to keep in history
            max_conversation_turns: Maximum conversation turns to maintain
            max_context_tokens: Token budget for context
        """
        self.max_history_entries = max_history_entries
        self.max_conversation_turns = max_conversation_turns
        self.max_context_tokens = max_context_tokens
        
        self._history: deque = deque(maxlen=max_history_entries)
        self._conversation: List[ConversationTurn] = []
        self._visited_urls: set = set()
        self._discovered_elements: Dict[str, List[Dict]] = {}  # URL -> elements
        self._current_page: Optional[str] = None
        self._session_start: datetime = datetime.utcnow()
    
    def add_observation(
        self,
        page_url: str,
        page_title: str,
        elements: Optional[List[Dict]] = None,
        screenshot_path: Optional[str] = None
    ) -> None:
        """
        Record a page observation.
        
        Args:
            page_url: The observed page URL
            page_title: The page title
            elements: Interactive elements found
            screenshot_path: Path to screenshot
        """
        self._current_page = page_url
        self._visited_urls.add(page_url)
        
        if elements:
            self._discovered_elements[page_url] = elements
        
        entry = ContextEntry(
            timestamp=datetime.utcnow(),
            entry_type="observation",
            content={
                "url": page_url,
                "title": page_title,
                "element_count": len(elements) if elements else 0,
                "screenshot": screenshot_path,
            },
            page_url=page_url,
            importance=1.0
        )
        self._history.append(entry)
    
    def add_action(
        self,
        action_type: str,
        target: Optional[str],
        value: Optional[str] = None,
        success: bool = True,
        error: Optional[str] = None
    ) -> None:
        """
        Record an executed action.
        
        Args:
            action_type: Type of action performed
            target: Element targeted
            value: Value used (for type actions)
            success: Whether action succeeded
            error: Error message if failed
        """
        importance = 1.0 if success else 1.5  # Failures are more important
        
        entry = ContextEntry(
            timestamp=datetime.utcnow(),
            entry_type="action",
            content={
                "action": action_type,
                "target": target,
                "value": value,
                "success": success,
                "error": error,
            },
            page_url=self._current_page,
            importance=importance
        )
        self._history.append(entry)
    
    def add_issue(
        self,
        issue_type: str,
        description: str,
        severity: str,
        element: Optional[str] = None
    ) -> None:
        """
        Record a detected issue.
        
        Args:
            issue_type: Type of issue
            description: Issue description
            severity: Severity level
            element: Related element
        """
        # Issues are high importance
        importance = {"critical": 2.0, "high": 1.8, "medium": 1.5, "low": 1.2}.get(
            severity, 1.0
        )
        
        entry = ContextEntry(
            timestamp=datetime.utcnow(),
            entry_type="issue",
            content={
                "type": issue_type,
                "description": description,
                "severity": severity,
                "element": element,
            },
            page_url=self._current_page,
            importance=importance
        )
        self._history.append(entry)
    
    def add_conversation_turn(
        self,
        role: str,
        content: str,
        token_count: int = 0
    ) -> None:
        """
        Add a conversation turn.
        
        Args:
            role: 'user', 'assistant', or 'system'
            content: The message content
            token_count: Estimated token count
        """
        turn = ConversationTurn(
            role=role,
            content=content,
            token_count=token_count
        )
        self._conversation.append(turn)
        
        # Trim if needed
        self._trim_conversation()
    
    def _trim_conversation(self) -> None:
        """Trim conversation to stay within limits"""
        # Remove old turns if over limit
        while len(self._conversation) > self.max_conversation_turns:
            self._conversation.pop(0)
        
        # Check token count
        total_tokens = sum(t.token_count for t in self._conversation)
        while total_tokens > self.max_context_tokens and len(self._conversation) > 1:
            removed = self._conversation.pop(0)
            total_tokens -= removed.token_count
    
    def get_relevant_context(
        self,
        current_url: Optional[str] = None,
        include_history: bool = True,
        include_elements: bool = True,
        max_entries: int = 10
    ) -> Dict[str, Any]:
        """
        Get relevant context for the current situation.
        
        Args:
            current_url: Current page URL
            include_history: Include action history
            include_elements: Include discovered elements
            max_entries: Maximum history entries to include
            
        Returns:
            Context dictionary for prompt building
        """
        context = {
            "session_duration_seconds": (
                datetime.utcnow() - self._session_start
            ).total_seconds(),
            "pages_visited": list(self._visited_urls),
            "pages_visited_count": len(self._visited_urls),
            "current_page": current_url or self._current_page,
        }
        
        if include_history:
            # Get most recent and most important entries
            recent = list(self._history)[-max_entries:]
            context["recent_actions"] = [
                e.content for e in recent if e.entry_type == "action"
            ]
            context["recent_issues"] = [
                e.content for e in recent if e.entry_type == "issue"
            ]
        
        if include_elements and current_url:
            elements = self._discovered_elements.get(current_url, [])
            context["known_elements"] = elements[:20]  # Limit for token efficiency
        
        return context
    
    def get_conversation_messages(self) -> List[Dict[str, str]]:
        """
        Get conversation history in API format.
        
        Returns:
            List of message dictionaries
        """
        return [
            {"role": turn.role, "content": turn.content}
            for turn in self._conversation
        ]
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the session.
        
        Returns:
            Summary statistics
        """
        actions = [e for e in self._history if e.entry_type == "action"]
        issues = [e for e in self._history if e.entry_type == "issue"]
        
        return {
            "duration_seconds": (datetime.utcnow() - self._session_start).total_seconds(),
            "pages_visited": len(self._visited_urls),
            "total_actions": len(actions),
            "successful_actions": sum(1 for a in actions if a.content.get("success")),
            "failed_actions": sum(1 for a in actions if not a.content.get("success")),
            "issues_found": len(issues),
            "issues_by_severity": {
                severity: sum(
                    1 for i in issues if i.content.get("severity") == severity
                )
                for severity in ["critical", "high", "medium", "low"]
            },
        }
    
    def clear(self) -> None:
        """Clear all context"""
        self._history.clear()
        self._conversation.clear()
        self._visited_urls.clear()
        self._discovered_elements.clear()
        self._current_page = None
        self._session_start = datetime.utcnow()
