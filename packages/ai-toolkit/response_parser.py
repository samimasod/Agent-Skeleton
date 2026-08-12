"""
Response Parser - Parses and validates AI model responses
"""
import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union


@dataclass
class ParsedResponse:
    """Container for parsed AI response"""
    success: bool
    data: Dict[str, Any] = field(default_factory=dict)
    raw_text: str = ""
    error: Optional[str] = None
    confidence: float = 1.0


class ResponseParser:
    """
    Parses AI model responses and extracts structured data.
    Handles various response formats and validates data.
    """
    
    def __init__(self, strict: bool = False):
        """
        Initialize the parser.
        
        Args:
            strict: If True, fail on any parsing issues. If False, try to recover.
        """
        self.strict = strict
    
    def parse(self, response: str) -> ParsedResponse:
        """
        Parse an AI response and extract structured data.
        
        Args:
            response: The raw response text from the AI model
            
        Returns:
            ParsedResponse with extracted data
        """
        if not response:
            return ParsedResponse(
                success=False,
                raw_text=response,
                error="Empty response"
            )
        
        # Try direct JSON parsing first
        json_data = self._try_parse_json(response)
        if json_data is not None:
            return ParsedResponse(
                success=True,
                data=json_data,
                raw_text=response
            )
        
        # Try extracting JSON from markdown code blocks
        json_data = self._extract_json_from_markdown(response)
        if json_data is not None:
            return ParsedResponse(
                success=True,
                data=json_data,
                raw_text=response,
                confidence=0.9
            )
        
        # Try finding JSON object in text
        json_data = self._find_json_in_text(response)
        if json_data is not None:
            return ParsedResponse(
                success=True,
                data=json_data,
                raw_text=response,
                confidence=0.8
            )
        
        # Try extracting key-value pairs
        if not self.strict:
            kv_data = self._extract_key_values(response)
            if kv_data:
                return ParsedResponse(
                    success=True,
                    data=kv_data,
                    raw_text=response,
                    confidence=0.6
                )
        
        # Failed to parse
        return ParsedResponse(
            success=False,
            raw_text=response,
            error="Could not parse response as structured data"
        )
    
    def _try_parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Try to parse text as JSON directly"""
        try:
            data = json.loads(text.strip())
            if isinstance(data, dict):
                return data
            elif isinstance(data, list):
                return {"items": data}
            return None
        except json.JSONDecodeError:
            return None
    
    def _extract_json_from_markdown(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from markdown code blocks"""
        patterns = [
            r"```json\s*([\s\S]*?)\s*```",
            r"```\s*([\s\S]*?)\s*```",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                result = self._try_parse_json(match)
                if result is not None:
                    return result
        
        return None
    
    def _find_json_in_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Find a JSON object within the text"""
        # Find all potential JSON object boundaries
        brace_positions: List[tuple] = []
        depth = 0
        start = -1
        
        for i, char in enumerate(text):
            if char == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0 and start >= 0:
                    brace_positions.append((start, i + 1))
                    start = -1
        
        # Try parsing each potential JSON object (prefer longer ones)
        brace_positions.sort(key=lambda x: x[1] - x[0], reverse=True)
        
        for start, end in brace_positions:
            candidate = text[start:end]
            result = self._try_parse_json(candidate)
            if result is not None:
                return result
        
        return None
    
    def _extract_key_values(self, text: str) -> Dict[str, Any]:
        """Extract key-value pairs from text as a fallback"""
        result = {}
        
        # Pattern for "key: value" or "key = value"
        patterns = [
            r"['\"]?(\w+)['\"]?\s*:\s*['\"]?([^'\"\n,}]+)['\"]?",
            r"(\w+)\s*=\s*['\"]?([^'\"\n]+)['\"]?",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for key, value in matches:
                # Clean up the value
                value = value.strip()
                
                # Try to convert to appropriate type
                if value.lower() in ('true', 'false'):
                    result[key] = value.lower() == 'true'
                elif value.isdigit():
                    result[key] = int(value)
                elif self._is_float(value):
                    result[key] = float(value)
                else:
                    result[key] = value
        
        return result
    
    def _is_float(self, value: str) -> bool:
        """Check if a string represents a float"""
        try:
            float(value)
            return '.' in value
        except ValueError:
            return False
    
    def extract_actions(self, response: ParsedResponse) -> List[Dict[str, Any]]:
        """Extract action suggestions from a parsed response"""
        if not response.success:
            return []
        
        # Look for actions in various possible keys
        action_keys = ['suggested_actions', 'actions', 'next_actions', 'recommendations']
        
        for key in action_keys:
            if key in response.data:
                actions = response.data[key]
                if isinstance(actions, list):
                    return actions
        
        return []
    
    def extract_issues(self, response: ParsedResponse) -> List[Dict[str, Any]]:
        """Extract detected issues from a parsed response"""
        if not response.success:
            return []
        
        # Look for issues in various possible keys
        issue_keys = ['issues', 'potential_issues', 'problems', 'bugs', 'errors']
        
        for key in issue_keys:
            if key in response.data:
                issues = response.data[key]
                if isinstance(issues, list):
                    return issues
        
        return []
    
    def extract_elements(self, response: ParsedResponse) -> List[Dict[str, Any]]:
        """Extract identified elements from a parsed response"""
        if not response.success:
            return []
        
        # Look for elements in various possible keys
        element_keys = ['elements', 'interactive_elements', 'components']
        
        for key in element_keys:
            if key in response.data:
                elements = response.data[key]
                if isinstance(elements, list):
                    return elements
        
        return []
