"""
Utility module for TOON (Token-Oriented Object Notation) serialization to reduce LLM token usage.
"""
import json
import logging
from typing import Any, Union

logger = logging.getLogger(__name__)

# Try importing high-performance Rust-backed toons package
try:
    import toons
    HAS_TOONS = True
except ImportError:
    HAS_TOONS = False


def format_to_toon(data: Any) -> str:
    """
    Serializes a Python object or JSON string into TOON format to minimize token overhead.
    Falls back to standard JSON string if conversion is unavailable or invalid.
    """
    if isinstance(data, str):
        try:
            parsed = json.loads(data)
        except Exception:
            return data  # Plain text output
    else:
        parsed = data

    if HAS_TOONS and isinstance(parsed, (dict, list)):
        try:
            return toons.dumps(parsed)
        except Exception as e:
            logger.debug(f"TOON conversion fallback to JSON: {e}")

    return json.dumps(parsed) if not isinstance(data, str) else data


def compress_tool_output_for_llm(output: str) -> str:
    """
    Compresses raw tool output (JSON or dictionary string) into TOON format
    specifically for inclusion in LLM prompt context windows.
    """
    if not output:
        return ""
    return format_to_toon(output)
