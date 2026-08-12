"""
Sample tool mock definitions and streaming event generators for mock mode.
"""
from typing import Dict, Any, Optional

SAMPLE_TOOLS_METADATA: Dict[str, Dict[str, Any]] = {
    "get_weather": {
        "ui_mode": "inline",
        "display_label_running": "Finding weather...",
        "display_label_completed": "Found weather",
        "default_args": {"city": "Paris"},
        "mock_output": '{"city": "Paris", "temperature": "22°C", "condition": "Sunny", "humidity": "60%", "wind": "15 km/h"}',
        "final_text": "Here is the weather report for Paris:",
        "thinking_text": "*(thinking: resolving weather report via attached script...)*\n\n",
    },
    "get_stock_price": {
        "ui_mode": "inline",
        "display_label_running": "Fetching market price...",
        "display_label_completed": "Retrieved stock price",
        "default_args": {"symbol": "AAPL"},
        "mock_output": '{"symbol": "AAPL", "company": "Apple Inc.", "price": "178.45", "change": "+2.35%"}',
        "final_text": "Here is the stock summary for AAPL:",
        "thinking_text": "*(thinking: loading market index data via attached script...)*\n\n",
    },
    "calculate_mortgage": {
        "ui_mode": "inline",
        "display_label_running": "Calculating mortgage payments...",
        "display_label_completed": "Mortgage calculated",
        "default_args": {"principal": 450000, "rate": 5.5, "years": 30},
        "mock_output": '{"monthly_payment": "$2,555.00", "loan_amount": "$450,000", "interest_rate": "5.5%", "term": "30 Years"}',
        "final_text": "Here is the calculated mortgage breakdown:",
        "thinking_text": "*(thinking: calculating amortization schedule and interest rate benchmarks...)*\n\n",
    },
    "search_web": {
        "ui_mode": "collapsible",
        "display_label_running": "Searching the web...",
        "display_label_completed": "Web search complete",
        "default_args": {"query": "Latest AI Framework Trends"},
        "mock_output": '{"query": "Latest AI Framework Trends", "total_results": 1250, "top_source": "https://ai.example.com/trends-2026"}',
        "final_text": "I have searched the web. The results have been stored inside the Chain of Thought accordion.",
        "thinking_text": "*(thinking: querying search indices and filtering top results...)*\n\n",
    },
    "read_file": {
        "ui_mode": "collapsible",
        "display_label_running": "Reading file contents...",
        "display_label_completed": "File read successfully",
        "default_args": {"filename": "config.json"},
        "mock_output": "{\n  \"app_version\": \"2.4.0\",\n  \"environment\": \"production\",\n  \"status\": \"healthy\"\n}",
        "final_text": "The file has been read. Inspect the Chain of Thought details to view raw contents.",
        "thinking_text": "*(thinking: reading target file buffer from storage volume...)*\n\n",
    },
    "fetch_user_profile": {
        "ui_mode": "both",
        "display_label_running": "Fetching user profile...",
        "display_label_completed": "Profile loaded",
        "default_args": {"user_id": "usr_99"},
        "mock_output": '{"user_id": "usr_99", "name": "Sarah Connor", "role": "Administrator", "tier": "Enterprise"}',
        "final_text": "User profile retrieved successfully. Displayed in hybrid mode (step + inline).",
        "thinking_text": "*(thinking: querying user identity directory...)*\n\n",
    },
}

MOCK_WELCOME_MESSAGE = (
    "Hello! I am a simulated agent running in mock mode. You can test tools by typing:\n\n"
    "**`run <tool_name> <arguments_json>`**\n\n"
    "### Sample Triggers to test different UI Modes:\n"
    "• **Weather Widget** (`ui_mode: inline`): `test weather` or `run get_weather {\"city\": \"Tokyo\"}`\n"
    "• **Stock Widget** (`ui_mode: inline`): `test stock` or `run get_stock_price {\"symbol\": \"TSLA\"}`\n"
    "• **Mortgage Card** (`ui_mode: inline`): `test mortgage` or `run calculate_mortgage {\"principal\": 500000}`\n"
    "• **Web Search** (`ui_mode: collapsible`): `test search` or `run search_web {\"query\": \"AI trends\"}`\n"
    "• **File Reader** (`ui_mode: collapsible`): `test file` or `run read_file {\"filename\": \"config.json\"}`\n"
    "• **User Profile** (`ui_mode: both`): `test profile` or `run fetch_user_profile {\"user_id\": \"usr_99\"}`"
)


def match_sample_tool_trigger(user_msg: str) -> Optional[str]:
    msg = user_msg.lower()
    if "weather" in msg:
        return "get_weather"
    if "stock" in msg:
        return "get_stock_price"
    if "mortgage" in msg:
        return "calculate_mortgage"
    if "search" in msg:
        return "search_web"
    if "file" in msg:
        return "read_file"
    if "profile" in msg:
        return "fetch_user_profile"
    return None
