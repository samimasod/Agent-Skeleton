"""
Playwright client wrapper with self-healing selectors and smart wait strategies.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import asyncio

# Playwright - conditionally imported
try:
    from playwright.async_api import Page, Locator, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Page = None
    Locator = None


@dataclass
class ElementLocator:
    """Represents multiple strategies to locate an element."""
    primary: str  # Primary selector
    alternatives: List[str] = None  # Alternative selectors
    text: Optional[str] = None  # Text content for text-based matching
    role: Optional[str] = None  # ARIA role
    test_id: Optional[str] = None  # data-testid attribute
    
    def __post_init__(self):
        if self.alternatives is None:
            self.alternatives = []


@dataclass
class ActionResult:
    """Result of a browser action."""
    success: bool
    selector_used: Optional[str] = None
    error: Optional[str] = None
    screenshot_path: Optional[str] = None


class PlaywrightClient:
    """
    High-level Playwright wrapper with self-healing selectors and smart waits.
    """
    
    def __init__(
        self,
        page: "Page",
        default_timeout: int = 30000,
        retry_attempts: int = 3,
    ):
        self.page = page
        self.default_timeout = default_timeout
        self.retry_attempts = retry_attempts
        
        # Selector memory for self-healing
        self._selector_history: Dict[str, List[str]] = {}
    
    async def _find_element(
        self,
        locator: ElementLocator,
        timeout: Optional[int] = None,
    ) -> Tuple[Optional["Locator"], str]:
        """
        Find an element using multiple selector strategies.
        
        Returns:
            Tuple of (Locator, selector_used) or (None, error_message)
        """
        if not PLAYWRIGHT_AVAILABLE:
            return None, "Playwright not available"
        
        timeout = timeout or self.default_timeout
        
        # Try primary selector first
        selectors_to_try = [locator.primary] + (locator.alternatives or [])
        
        # Add text-based locator if available
        if locator.text:
            selectors_to_try.append(f"text={locator.text}")
        
        # Add test-id locator if available
        if locator.test_id:
            selectors_to_try.append(f"[data-testid='{locator.test_id}']")
        
        # Add role-based locator if available
        if locator.role:
            if locator.text:
                selectors_to_try.insert(0, f"role={locator.role}[name='{locator.text}']")
            else:
                selectors_to_try.append(f"role={locator.role}")
        
        # Try each selector
        for selector in selectors_to_try:
            try:
                element = self.page.locator(selector).first
                await element.wait_for(timeout=min(timeout // len(selectors_to_try), 5000))
                
                # Store successful selector for future use
                if locator.primary not in self._selector_history:
                    self._selector_history[locator.primary] = []
                if selector not in self._selector_history[locator.primary]:
                    self._selector_history[locator.primary].append(selector)
                
                return element, selector
            except Exception:
                continue
        
        return None, f"Could not find element with any selector: {selectors_to_try}"
    
    async def click(
        self,
        locator: ElementLocator,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """
        Click an element with self-healing selector support.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        element, selector_or_error = await self._find_element(locator, timeout)
        
        if element is None:
            return ActionResult(success=False, error=selector_or_error)
        
        try:
            await element.click(timeout=timeout or self.default_timeout)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def fill(
        self,
        locator: ElementLocator,
        value: str,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """
        Fill an input element with text.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        element, selector_or_error = await self._find_element(locator, timeout)
        
        if element is None:
            return ActionResult(success=False, error=selector_or_error)
        
        try:
            await element.fill(value, timeout=timeout or self.default_timeout)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def type_text(
        self,
        locator: ElementLocator,
        value: str,
        delay: int = 50,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """
        Type text into an element character by character (for realistic input).
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        element, selector_or_error = await self._find_element(locator, timeout)
        
        if element is None:
            return ActionResult(success=False, error=selector_or_error)
        
        try:
            await element.type(value, delay=delay)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def select_option(
        self,
        locator: ElementLocator,
        value: str,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """
        Select an option from a dropdown.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        element, selector_or_error = await self._find_element(locator, timeout)
        
        if element is None:
            return ActionResult(success=False, error=selector_or_error)
        
        try:
            await element.select_option(value, timeout=timeout or self.default_timeout)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def hover(
        self,
        locator: ElementLocator,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """Hover over an element."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")

        element, selector_or_error = await self._find_element(locator, timeout)
        if element is None:
            return ActionResult(success=False, error=selector_or_error)

        try:
            await element.hover(timeout=timeout or self.default_timeout)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def press(
        self,
        locator: ElementLocator,
        key: str,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """Press a keyboard key on an element."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")

        element, selector_or_error = await self._find_element(locator, timeout)
        if element is None:
            return ActionResult(success=False, error=selector_or_error)

        try:
            await element.press(key, timeout=timeout or self.default_timeout)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def navigate(self, url: str, wait_until: str = "domcontentloaded") -> ActionResult:
        """
        Navigate to a URL and wait for page load.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        try:
            await self.page.goto(url, wait_until=wait_until, timeout=self.default_timeout)
            return ActionResult(success=True)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def wait_for_navigation(self, timeout: Optional[int] = None) -> ActionResult:
        """
        Wait for navigation to complete.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        try:
            await self.page.wait_for_load_state(
                "load",
                timeout=timeout or self.default_timeout
            )
            return ActionResult(success=True)
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def wait_for_url_contains(
        self,
        fragment: str,
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """Wait until the current URL contains the given fragment."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")

        try:
            await self.page.wait_for_url(
                f"**/*{fragment}*",
                timeout=timeout or self.default_timeout,
            )
            return ActionResult(success=True)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def wait_for_element(
        self,
        locator: ElementLocator,
        state: str = "visible",
        timeout: Optional[int] = None,
    ) -> ActionResult:
        """
        Wait for an element to reach a specific state.
        
        Args:
            state: One of "attached", "detached", "visible", "hidden"
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        element, selector_or_error = await self._find_element(locator, timeout)
        
        if element is None:
            return ActionResult(success=False, error=selector_or_error)
        
        try:
            await element.wait_for(state=state, timeout=timeout or self.default_timeout)
            return ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    async def get_text(
        self,
        locator: ElementLocator,
        timeout: Optional[int] = None,
    ) -> Tuple[Optional[str], ActionResult]:
        """
        Get text content of an element.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return None, ActionResult(success=False, error="Playwright not available")
        
        element, selector_or_error = await self._find_element(locator, timeout)
        
        if element is None:
            return None, ActionResult(success=False, error=selector_or_error)
        
        try:
            text = await element.text_content()
            return text, ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return None, ActionResult(success=False, error=str(e))

    async def get_attribute(
        self,
        locator: ElementLocator,
        name: str,
        timeout: Optional[int] = None,
    ) -> Tuple[Optional[str], ActionResult]:
        """Get an attribute value from an element."""
        if not PLAYWRIGHT_AVAILABLE:
            return None, ActionResult(success=False, error="Playwright not available")

        element, selector_or_error = await self._find_element(locator, timeout)
        if element is None:
            return None, ActionResult(success=False, error=selector_or_error)

        try:
            value = await element.get_attribute(name)
            return value, ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return None, ActionResult(success=False, error=str(e))

    async def get_input_value(
        self,
        locator: ElementLocator,
        timeout: Optional[int] = None,
    ) -> Tuple[Optional[str], ActionResult]:
        """Get the current value of an input-like element."""
        if not PLAYWRIGHT_AVAILABLE:
            return None, ActionResult(success=False, error="Playwright not available")

        element, selector_or_error = await self._find_element(locator, timeout)
        if element is None:
            return None, ActionResult(success=False, error=selector_or_error)

        try:
            value = await element.input_value()
            return value, ActionResult(success=True, selector_used=selector_or_error)
        except Exception as e:
            return None, ActionResult(success=False, error=str(e))
    
    async def is_visible(self, locator: ElementLocator) -> bool:
        """
        Check if an element is visible.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return False
        
        element, _ = await self._find_element(locator, timeout=5000)
        
        if element is None:
            return False
        
        try:
            return await element.is_visible()
        except Exception:
            return False
    
    async def screenshot(
        self,
        path: str,
        full_page: bool = False,
    ) -> ActionResult:
        """
        Take a screenshot of the page.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(success=False, error="Playwright not available")
        
        try:
            await self.page.screenshot(path=path, full_page=full_page)
            return ActionResult(success=True, screenshot_path=path)
        except Exception as e:
            return ActionResult(success=False, error=str(e))
    
    def get_successful_selectors(self, primary_selector: str) -> List[str]:
        """
        Get the list of selectors that have worked for a given primary selector.
        Useful for self-healing tests.
        """
        return self._selector_history.get(primary_selector, [])
