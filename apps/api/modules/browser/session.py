"""
Session recording for test runs.
Captures screenshots, videos, network logs, and console errors.
"""
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
import json
import uuid

# Playwright - conditionally imported
try:
    from playwright.async_api import Page, Response, Request
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Page = None


logger = logging.getLogger(__name__)


@dataclass
class ConsoleMessage:
    """Represents a console message from the browser."""
    type: str  # log, error, warning, info
    text: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    location: Optional[str] = None


@dataclass
class NetworkRequest:
    """Represents a network request/response."""
    url: str
    method: str
    status: Optional[int] = None
    response_time_ms: Optional[int] = None
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Screenshot:
    """Represents a captured screenshot."""
    id: str
    path: str
    storage_path: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    page_url: Optional[str] = None


@dataclass
class SessionRecording:
    """Complete recording of a test session."""
    session_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    screenshots: List[Screenshot] = field(default_factory=list)
    console_messages: List[ConsoleMessage] = field(default_factory=list)
    network_requests: List[NetworkRequest] = field(default_factory=list)
    video_path: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "session_id": self.session_id,
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "screenshots": [
                {
                    "id": s.id,
                    "path": s.path,
                    "storage_path": s.storage_path,
                    "timestamp": s.timestamp.isoformat(),
                    "description": s.description,
                    "page_url": s.page_url,
                }
                for s in self.screenshots
            ],
            "console_messages": [
                {
                    "type": m.type,
                    "text": m.text,
                    "timestamp": m.timestamp.isoformat(),
                }
                for m in self.console_messages
            ],
            "network_requests": [
                {
                    "url": r.url,
                    "method": r.method,
                    "status": r.status,
                    "response_time_ms": r.response_time_ms,
                    "error": r.error,
                }
                for r in self.network_requests
            ],
            "video_path": self.video_path,
        }


class SessionRecorder:
    """
    Records browser sessions including screenshots, video, network logs, and console messages.
    """
    
    def __init__(
        self,
        session_id: Optional[str] = None,
        output_dir: str = "./data/recordings",
        record_video: bool = True,
        record_screenshots: bool = True,
        record_network: bool = True,
        record_console: bool = True,
    ):
        self.session_id = session_id or str(uuid.uuid4())
        self.output_dir = Path(output_dir) / self.session_id
        self.record_video = record_video
        self.record_screenshots = record_screenshots
        self.record_network = record_network
        self.record_console = record_console
        
        self.recording = SessionRecording(
            session_id=self.session_id,
            started_at=datetime.utcnow(),
        )
        
        self._page: Optional["Page"] = None
        self._request_timings: Dict[str, datetime] = {}
    
    async def start(self, page: "Page") -> None:
        """
        Start recording a page session.
        
        Args:
            page: The Playwright page to record
        """
        if not PLAYWRIGHT_AVAILABLE:
            return
        
        self._page = page
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Set up console message handler
        if self.record_console:
            page.on("console", self._on_console_message)
        
        # Set up network handlers
        if self.record_network:
            page.on("request", self._on_request)
            page.on("response", self._on_response)
            page.on("requestfailed", self._on_request_failed)
    
    def _on_console_message(self, message) -> None:
        """Handle console messages from the page."""
        self.recording.console_messages.append(
            ConsoleMessage(
                type=message.type,
                text=message.text,
                location=str(message.location) if hasattr(message, 'location') else None,
            )
        )
    
    def _on_request(self, request) -> None:
        """Handle network request start."""
        self._request_timings[request.url] = datetime.utcnow()
    
    def _on_response(self, response) -> None:
        """Handle network response."""
        start_time = self._request_timings.get(response.url)
        response_time = None
        if start_time:
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        self.recording.network_requests.append(
            NetworkRequest(
                url=response.url,
                method=response.request.method,
                status=response.status,
                response_time_ms=response_time,
            )
        )
    
    def _on_request_failed(self, request) -> None:
        """Handle failed network request."""
        self.recording.network_requests.append(
            NetworkRequest(
                url=request.url,
                method=request.method,
                error=str(request.failure) if hasattr(request, 'failure') else "Unknown error",
            )
        )
    
    async def capture_screenshot(
        self,
        description: Optional[str] = None,
        full_page: bool = False,
        wait_for_settle: bool = True,
    ) -> Optional[Screenshot]:
        """
        Capture a screenshot of the current page state.
        
        Args:
            description: Description of what the screenshot shows
            full_page: Whether to capture the full page or just viewport
            
        Returns:
            Screenshot object with path to the saved image
        """
        if not PLAYWRIGHT_AVAILABLE or not self._page or not self.record_screenshots:
            return None
        
        screenshot_id = str(uuid.uuid4())[:8]
        filename = f"screenshot_{len(self.recording.screenshots):04d}_{screenshot_id}.png"
        filepath = self.output_dir / filename
        
        try:
            if wait_for_settle:
                await self._wait_for_page_stable()

            await self._page.screenshot(
                path=str(filepath),
                full_page=full_page,
            )
            
            screenshot = Screenshot(
                id=screenshot_id,
                path=str(filepath),
                description=description,
                page_url=self._page.url,
            )
            self.recording.screenshots.append(screenshot)
            return screenshot
            
        except Exception:
            logger.exception("Failed to capture screenshot")
            return None

    async def _wait_for_page_stable(self) -> None:
        """Wait for the page to reach a reasonably stable visual state."""
        if not self._page:
            return

        for state in ("domcontentloaded", "load", "networkidle"):
            try:
                await self._page.wait_for_load_state(state, timeout=5000)
            except Exception:
                continue

        # Wait for fonts and a couple of paint frames when supported.
        try:
            await self._page.evaluate(
                """
                async () => {
                    if (document.fonts?.ready) {
                        await document.fonts.ready;
                    }
                    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                }
                """
            )
        except Exception:
            pass

        await asyncio.sleep(0.5)
    
    async def stop(self) -> SessionRecording:
        """
        Stop recording and finalize the session.
        
        Returns:
            The complete session recording
        """
        self.recording.ended_at = datetime.utcnow()
        
        # Save recording metadata
        metadata_path = self.output_dir / "recording.json"
        try:
            with open(metadata_path, "w") as f:
                json.dump(self.recording.to_dict(), f, indent=2)
        except Exception:
            logger.exception("Failed to save recording metadata")
        
        return self.recording
    
    def get_console_errors(self) -> List[ConsoleMessage]:
        """Get all console error messages."""
        return [m for m in self.recording.console_messages if m.type == "error"]
    
    def get_failed_requests(self) -> List[NetworkRequest]:
        """Get all failed network requests."""
        return [r for r in self.recording.network_requests if r.error or (r.status and r.status >= 400)]
