"""
Prompt Builder - Constructs optimized prompts for AI vision analysis
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


class PromptTemplate(str, Enum):
    """Pre-defined prompt templates for common tasks"""
    ANALYZE_PAGE = "analyze_page"
    IDENTIFY_ELEMENTS = "identify_elements"
    DETECT_ISSUES = "detect_issues"
    SUGGEST_ACTIONS = "suggest_actions"
    VERIFY_OUTCOME = "verify_outcome"


@dataclass
class PromptContext:
    """Context information for prompt construction"""
    page_url: str = ""
    page_title: str = ""
    previous_actions: List[Dict[str, Any]] = field(default_factory=list)
    test_objective: str = ""
    focus_areas: List[str] = field(default_factory=list)
    known_elements: List[Dict[str, Any]] = field(default_factory=list)


class PromptBuilder:
    """
    Builds optimized prompts for AI vision agents.
    Manages context and generates structured prompts for various testing tasks.
    """
    
    # Base system prompt for all testing tasks
    SYSTEM_PROMPT = """You are an expert QA testing AI agent that analyzes web applications.
Your goal is to help identify bugs, usability issues, and test web application functionality.

When analyzing screenshots, you should:
1. Identify all interactive elements (buttons, links, forms, inputs)
2. Look for visual issues (broken layouts, overlapping elements, missing images)
3. Check for accessibility problems (low contrast, missing labels)
4. Suggest actions to explore the application further
5. Note any potential bugs or unexpected behavior

Always respond with structured JSON when requested."""

    TEMPLATES = {
        PromptTemplate.ANALYZE_PAGE: """Analyze this web page screenshot.

Page URL: {url}
Page Title: {title}

Please provide a comprehensive analysis in the following JSON format:
{{
    "description": "Brief description of the page purpose and content",
    "page_type": "login|dashboard|form|list|detail|error|other",
    "interactive_elements": [
        {{
            "type": "button|link|input|select|checkbox|other",
            "text": "visible text or label",
            "purpose": "what this element does",
            "selector_hint": "suggested CSS selector"
        }}
    ],
    "suggested_actions": [
        {{
            "action": "click|type|select|navigate|scroll",
            "target": "element selector or description",
            "value": "value to input if applicable",
            "priority": 1,
            "reason": "why this action should be performed"
        }}
    ],
    "potential_issues": [
        {{
            "type": "visual|accessibility|functionality|performance",
            "severity": "critical|high|medium|low",
            "description": "description of the issue",
            "element": "affected element if applicable"
        }}
    ]
}}""",

        PromptTemplate.IDENTIFY_ELEMENTS: """Identify all interactive elements in this screenshot.

For each element, provide:
{{
    "elements": [
        {{
            "type": "button|link|input|select|textarea|checkbox|radio|other",
            "text": "visible text or label",
            "location": "approximate position (top-left, center, etc.)",
            "state": "enabled|disabled|focused|selected",
            "attributes": {{
                "id_hint": "possible id",
                "class_hint": "key class names",
                "role": "ARIA role if apparent"
            }}
        }}
    ]
}}""",

        PromptTemplate.DETECT_ISSUES: """Analyze this screenshot for potential issues.

Look for:
1. Visual bugs (layout issues, overlapping, alignment problems)
2. Accessibility issues (contrast, missing labels, focus indicators)
3. Broken or missing content (404 images, empty containers)
4. Usability problems (confusing UI, hidden elements)

Respond with:
{{
    "issues": [
        {{
            "type": "visual|accessibility|content|usability",
            "severity": "critical|high|medium|low",
            "title": "brief issue title",
            "description": "detailed description",
            "location": "where on the page",
            "suggested_fix": "how to fix this issue",
            "wcag_violation": "WCAG guideline if accessibility issue"
        }}
    ],
    "overall_quality": "good|acceptable|poor",
    "summary": "overall assessment"
}}""",

        PromptTemplate.SUGGEST_ACTIONS: """Based on this screenshot, suggest the next testing actions.

{context}

Consider:
1. What interactive elements are available
2. What flows haven't been tested
3. Edge cases to try
4. Form validations to test

Respond with:
{{
    "suggested_actions": [
        {{
            "action": "click|type|select|navigate|hover|scroll",
            "target": "element selector or description",
            "value": "value to use if applicable",
            "priority": 1,
            "reason": "why this action is valuable",
            "expected_outcome": "what should happen"
        }}
    ],
    "exploration_complete": false,
    "coverage_estimate": "percentage of visible elements tested"
}}""",

        PromptTemplate.VERIFY_OUTCOME: """Verify the outcome of the previous action.

Previous action: {action}
Expected outcome: {expected}

Analyze the current screenshot and determine:
{{
    "outcome_matched": true,
    "actual_outcome": "what actually happened",
    "issues_detected": [
        {{
            "type": "unexpected_behavior|error|visual_change",
            "description": "what went wrong",
            "severity": "critical|high|medium|low"
        }}
    ],
    "page_changed": true,
    "new_elements": ["list of new interactive elements"],
    "recommendation": "next action recommendation"
}}"""
    }

    def __init__(self, context: Optional[PromptContext] = None):
        self.context = context or PromptContext()
    
    def set_context(self, context: PromptContext) -> None:
        """Update the prompt context"""
        self.context = context
    
    def build(
        self,
        template: PromptTemplate,
        **kwargs
    ) -> str:
        """
        Build a prompt using a template and context.
        
        Args:
            template: The prompt template to use
            **kwargs: Additional template variables
            
        Returns:
            The formatted prompt string
        """
        template_str = self.TEMPLATES.get(template, "")
        
        # Add context variables
        format_vars = {
            "url": self.context.page_url,
            "title": self.context.page_title,
            "context": self._format_context(),
            **kwargs
        }
        
        try:
            return template_str.format(**format_vars)
        except KeyError as e:
            # Return template with missing variable noted
            return f"{template_str}\n\n[Missing variable: {e}]"
    
    def _format_context(self) -> str:
        """Format context information for inclusion in prompts"""
        parts = []
        
        if self.context.test_objective:
            parts.append(f"Test Objective: {self.context.test_objective}")
        
        if self.context.previous_actions:
            parts.append("Previous Actions:")
            for action in self.context.previous_actions[-5:]:  # Last 5 actions
                parts.append(f"  - {action.get('action', 'unknown')}: {action.get('target', '')}")
        
        if self.context.focus_areas:
            parts.append(f"Focus Areas: {', '.join(self.context.focus_areas)}")
        
        return "\n".join(parts) if parts else "No additional context"
    
    def build_custom(self, prompt: str, include_system: bool = True) -> str:
        """
        Build a custom prompt with optional system context.
        
        Args:
            prompt: The custom prompt text
            include_system: Whether to include system prompt context
            
        Returns:
            The complete prompt
        """
        if include_system:
            return f"{self.SYSTEM_PROMPT}\n\n{prompt}"
        return prompt
    
    @property
    def system_prompt(self) -> str:
        """Get the system prompt"""
        return self.SYSTEM_PROMPT
