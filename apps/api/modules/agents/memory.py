"""
Memory Management Module: Handles Tool Output Pruning, Context Pagination, and Rolling Conversation Summarization.
"""
import logging
from typing import List, Dict, Any, Optional
from apps.api.modules.llm.client import create_async_client

logger = logging.getLogger(__name__)


def prune_tool_messages(messages: List[Dict[str, Any]], max_recent_tool_turns: int = 3) -> List[Dict[str, Any]]:
    """
    Deterministically prunes raw JSON tool output payloads older than max_recent_tool_turns.
    Keeps tool_call_id and schema integrity intact for LLM prompt context.
    """
    if max_recent_tool_turns <= 0 or not messages:
        return messages

    # Identify indices of all tool output messages
    tool_msg_indices = [idx for idx, msg in enumerate(messages) if msg.get("role") == "tool"]

    if len(tool_msg_indices) <= max_recent_tool_turns:
        return messages

    # Indices of tool messages to prune (all except the last N)
    indices_to_prune = set(tool_msg_indices[:-max_recent_tool_turns])

    pruned = []
    for idx, msg in enumerate(messages):
        if idx in indices_to_prune:
            pruned_msg = dict(msg)
            tool_name = msg.get("name") or "tool"
            pruned_msg["content"] = f"[Tool '{tool_name}' output incorporated into assistant message above.]"
            pruned.append(pruned_msg)
        else:
            pruned.append(msg)

    return pruned


async def generate_and_update_session_summary(
    session_repo: Any,
    session_id: str,
    messages_to_summarize: List[Dict[str, Any]],
    summary_model_id: str = "openai/gpt-4o-mini",
    existing_summary: Optional[str] = None,
) -> Optional[str]:
    """
    Summarizes a block of historical messages using the configured summary_model_id
    and persists the result in the database session.
    """
    if not messages_to_summarize:
        return existing_summary

    client = create_async_client()

    transcript_lines = []
    if existing_summary:
        transcript_lines.append(f"Prior Session Summary:\n{existing_summary}\n")

    for msg in messages_to_summarize:
        role = msg.get("role", "unknown")
        content = msg.get("content") or ""
        if role in ("user", "assistant") and content:
            transcript_lines.append(f"{role.capitalize()}: {content}")

    transcript = "\n".join(transcript_lines)
    if not transcript.strip():
        return existing_summary

    prompt = (
        "Summarize the following chat conversation into 2-3 concise sentences. "
        "Highlight key user context, goals, decisions, and outcomes:\n\n"
        f"{transcript}"
    )

    try:
        response = await client.chat.completions.create(
            model=summary_model_id,
            messages=[
                {"role": "system", "content": "You are a concise conversation summarizer."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=250,
        )
        new_summary = response.choices[0].message.content.strip()
        if new_summary:
            await session_repo.update_session_summary(session_id, new_summary)
            logger.info(f"Updated session {session_id} summary using model {summary_model_id}")
            return new_summary
    except Exception as e:
        logger.error(f"Failed to generate session summary with model {summary_model_id}: {e}")

    return existing_summary
