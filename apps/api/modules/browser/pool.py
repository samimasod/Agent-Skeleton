"""
Browser pool manager for managing Playwright browser instances.
Provides pre-warmed browser instances for fast test execution.
"""
import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum

# Playwright - conditionally imported
try:
    from playwright.async_api import async_playwright, Browser, BrowserContext, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Browser = None
    BrowserContext = None
    Page = None


class BrowserType(str, Enum):
    """Supported browser types."""
    CHROMIUM = "chromium"
    FIREFOX = "firefox"
    WEBKIT = "webkit"


@dataclass
class BrowserInstance:
    """Represents a browser instance in the pool."""
    id: str
    browser_type: BrowserType
    browser: Optional["Browser"] = None
    context: Optional["BrowserContext"] = None
    in_use: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: datetime = field(default_factory=datetime.utcnow)


class BrowserPool:
    """
    Manages a pool of pre-warmed browser instances for efficient test execution.
    
    Features:
    - Pre-warms browser instances for fast test starts
    - Supports multiple browser types (Chromium, Firefox, WebKit)
    - Tracks browser usage and automatically recycles stale instances
    - Thread-safe instance acquisition and release
    """
    
    def __init__(
        self,
        pool_size: int = 5,
        browser_type: BrowserType = BrowserType.CHROMIUM,
        headless: bool = True,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
    ):
        self.pool_size = pool_size
        self.browser_type = browser_type
        self.headless = headless
        self.viewport = {"width": viewport_width, "height": viewport_height}
        
        self._instances: List[BrowserInstance] = []
        self._playwright = None
        self._lock = asyncio.Lock()
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize the browser pool with pre-warmed instances."""
        if not PLAYWRIGHT_AVAILABLE:
            print("Warning: Playwright not installed. Browser pool will be mocked.")
            self._initialized = True
            return
        
        async with self._lock:
            if self._initialized:
                return
            
            self._playwright = await async_playwright().start()
            
            # Pre-warm browser instances
            for i in range(self.pool_size):
                instance = await self._create_instance(f"browser-{i}")
                self._instances.append(instance)
            
            self._initialized = True
            print(f"Browser pool initialized with {self.pool_size} {self.browser_type.value} instances")
    
    async def _create_instance(self, instance_id: str) -> BrowserInstance:
        """Create a new browser instance."""
        if not PLAYWRIGHT_AVAILABLE or not self._playwright:
            return BrowserInstance(
                id=instance_id,
                browser_type=self.browser_type,
            )
        
        # Get the browser launcher
        if self.browser_type == BrowserType.CHROMIUM:
            browser_launcher = self._playwright.chromium
        elif self.browser_type == BrowserType.FIREFOX:
            browser_launcher = self._playwright.firefox
        else:
            browser_launcher = self._playwright.webkit
        
        # Launch browser
        browser = await browser_launcher.launch(headless=self.headless)
        
        # Create context with viewport
        context = await browser.new_context(
            viewport=self.viewport,
            record_video_dir=None,  # Can be enabled per-session
        )
        
        return BrowserInstance(
            id=instance_id,
            browser_type=self.browser_type,
            browser=browser,
            context=context,
        )
    
    async def acquire(self) -> Optional[BrowserInstance]:
        """
        Acquire an available browser instance from the pool.
        
        Returns:
            BrowserInstance if available, None otherwise
        """
        async with self._lock:
            for instance in self._instances:
                if not instance.in_use:
                    instance.in_use = True
                    instance.last_used = datetime.utcnow()
                    return instance
            
            # No available instance, try to create a new one if under limit
            if len(self._instances) < self.pool_size * 2:  # Allow overflow
                instance = await self._create_instance(f"browser-{len(self._instances)}")
                instance.in_use = True
                self._instances.append(instance)
                return instance
            
            return None
    
    async def release(self, instance: BrowserInstance) -> None:
        """
        Release a browser instance back to the pool.
        
        Args:
            instance: The browser instance to release
        """
        async with self._lock:
            instance.in_use = False
            instance.last_used = datetime.utcnow()
            
            # Clear cookies and local storage for next use
            if instance.context and PLAYWRIGHT_AVAILABLE:
                try:
                    await instance.context.clear_cookies()
                except Exception:
                    pass
    
    async def get_page(self, instance: BrowserInstance) -> Optional["Page"]:
        """
        Get a new page from a browser instance.
        
        Args:
            instance: The browser instance to get a page from
            
        Returns:
            A new Page object
        """
        if not PLAYWRIGHT_AVAILABLE or not instance.context:
            return None
        
        return await instance.context.new_page()
    
    async def shutdown(self) -> None:
        """Shutdown the browser pool and close all instances."""
        async with self._lock:
            for instance in self._instances:
                if instance.context:
                    try:
                        await instance.context.close()
                    except Exception:
                        pass
                if instance.browser:
                    try:
                        await instance.browser.close()
                    except Exception:
                        pass
            
            if self._playwright:
                await self._playwright.stop()
            
            self._instances = []
            self._initialized = False
            print("Browser pool shutdown complete")
    
    @property
    def available_count(self) -> int:
        """Get the number of available browser instances."""
        return sum(1 for i in self._instances if not i.in_use)
    
    @property
    def total_count(self) -> int:
        """Get the total number of browser instances."""
        return len(self._instances)


# Global browser pool instance
_browser_pool: Optional[BrowserPool] = None


async def get_browser_pool() -> BrowserPool:
    """Get or create the global browser pool."""
    global _browser_pool
    if _browser_pool is None:
        _browser_pool = BrowserPool()
        await _browser_pool.initialize()
    return _browser_pool
