# Agent Creation & Integration Guide

This guide describes how to configure, secure, and chat with conversational agents in the Multi-Tenant Application Skeleton.

---

## 1. Creating a New Agent

Agents are scoped to an **Organization** and represent a customized LLM execution profile.

### Via the Web UI
1. Navigate to the **Agent Builder** section (`/dashboard/agents`) in the sidebar.
2. Click **Create Agent**.
3. Fill out the agent metadata:
   *   **Name & Description**: User-facing identifiers.
   *   **Model**: Select from the OpenRouter catalog (e.g., `google/gemini-3.1-flash-lite-preview` or `openai/gpt-4o-mini`).
   *   **System Prompt**: Core instruction defining the agent's persona, constraints, and instructions.
   *   **Temperature**: Values between `0.0` (factual/deterministic) and `1.0` (creative).
4. Click **Save**.

### Via the API
Send a authenticated `POST` request to `/api/agents` with the following schema:
```json
{
  "name": "Customer Support Agent",
  "description": "Handles ticketing queries and refunds.",
  "system_prompt": "You are a customer support agent. Be helpful and professional.",
  "model_id": "google/gemini-3.1-flash-lite-preview",
  "temperature": 0.3,
  "organization_id": 1
}
```

---

## 2. Creating & Attaching Tools

Tools allow agents to perform actions (fetching weather, writing database records, executing code). 

### Step 1: Register the Tool (Super Admin Only)
Super admins register tools in the **Admin Panel** (`/dashboard/admin/tools`) by specifying:
1.  **Name**: Unique identifier (e.g. `query_database`).
2.  **Description**: Semantic explanation for the LLM.
3.  **JSON Parameter Schema**: Declares required inputs.
4.  **Python Script**: Python code that must implement a `run(**kwargs)` function.

Example Python script:
```python
import httpx

def run(city: str):
    # Perform HTTP request or database query
    r = httpx.get(f"https://api.weatherapi.com/v1/current.json?q={city}")
    data = r.json()
    temp = data["current"]["temp_c"]
    return f"The temperature in {city} is {temp}°C."
```

### Step 2: Attach the Tool to the Agent
In the Agent Builder edit screen, toggle the checkbox next to the registered tool. The UI sends a `PATCH` request updating the agent's associated tools list.

---

## 3. Connecting a Chat Session (WebSocket Streaming)

Conversations are conducted in real-time over a stateful WebSocket endpoint.

### Handshake Connection
Establish a WebSocket connection to the dynamic URL:
```
ws://<api_host>/api/agents/{agent_id}/chat/ws?token=<firebase_id_token>&session_id=<optional_session_uuid>
```
*   `agent_id`: Target agent.
*   `token`: Valid Firebase ID token.
*   `session_id`: Unique conversation thread ID. If omitted, the backend generates a new UUID.

### Communication Protocol
Once the connection is established:
1.  **Server Session Created**: The server returns:
    ```json
    { "type": "session_created", "session_id": "uuid-here", "history": [] }
    ```
2.  **Client Sends Message**:
    ```json
    { "type": "message", "content": "What is the weather in Paris?" }
    ```
3.  **Server Streams Response**:
    *   *Text Delta*:
        ```json
        { "type": "text_delta", "text": "Let me " }
        ```
    *   *Tool Execution Start*:
        ```json
        { "type": "tool_started", "tool_name": "get_weather", "tool_call_id": "call_1", "arguments": {"city": "Paris"} }
        ```
    *   *Tool Execution Result*:
        ```json
        { "type": "tool_completed", "tool_name": "get_weather", "tool_call_id": "call_1", "output": "The temperature in Paris is 22°C.", "error": null }
        ```
    *   *Final Turn Completion*:
        ```json
        { "type": "message_completed" }
        ```

### Reusable React Component (`<AgentChatView />`)

For any page or modal in `apps/web` that requires an agent chat interface, simply import and render `<AgentChatView />`:

```tsx
import { AgentChatView } from "@/components/agent-chat-view"

export function MyPage() {
  return (
    <AgentChatView
      agentId={42}
      agentName="Customer Support Agent"
      showSessionSelector={true}
      className="h-[600px]"
    />
  )
}
```

#### Component Props (`AgentChatViewProps`):
- `agentId` (number, required): Target agent ID.
- `agentName` (string, optional): Display header name.
- `initialSessionId` (string, optional): Pre-selected thread ID.
- `showSessionSelector` (boolean, default `true`): Renders thread history dropdown & New Chat button.
- `showHeader` (boolean, default `true`): Renders top agent header & connection status badge.
- `onSessionChange` (function, optional): Fired whenever active session changes.

It handles WebSocket streaming, historical pagination, `ChainOfThought` tool steps, client-side speech input, and `ToolApprovalCard` gates automatically.

---

## 4. Role-Based Access Control (RBAC)

Agent access is strictly gated at the Organization boundary.

| Role | Permissions |
| :--- | :--- |
| **Owner / Admin** | Create Agents, Modify Configuration, Attach/Detach Tools, Delete Agents, Chat. |
| **Member / Viewer** | List active agents, Chat/Execute Sessions. |
| **Super Admin** | Create/Edit/Delete global tools, Monitor runs across all tenants, and Run test tool executions. |

### Access Control Logic Flow
When any WebSocket connection is requested:
1.  Verify Firebase Token -> Resolve `user_uid`.
2.  Lookup `Agent` -> Find `organization_id`.
3.  Query member database: Does `user_uid` have an active membership role in `organization_id`?
    *   **Yes**: Accept handshake.
    *   **No**: Reject handshake with code `4003` (unauthorized).

---

## 5. Testing Tools & Simulating Runs

The system offers multiple ways to verify tool scripts and sandbox code without executing completions against live LLMs.

### 1. Interactive Sandbox Tester (Admin Panel)
Within `/dashboard/admin/tools`, Super-Admins can:
1. Select any tool registered in the database from the dropdown.
2. Provide dummy JSON arguments.
3. Click **Run Sandbox Test** to execute the Python script locally inside the secure runtime environment.
4. View compilation metrics and standard console outputs in the interactive terminal display.

### 2. Conversational Agent Simulation (Mock Model)
Developers and members can test tool run outcomes directly inside the chat workspace (web or mobile):
1. Configure your agent with the **`Local Simulated Mock Sandbox (Free)`** model.
2. Toggle active the tools you wish to test on that agent profile.
3. Open the agent chat session playground.
4. Execute any attached tool explicitly by typing:
   ```
   run <tool_name> <arguments_json>
   ```
   *Example*: `run get_weather {"city": "Berlin"}`
5. The local sandbox runner will compile and execute the tool's actual python script in real-time, stream intermediate WebSocket events (`tool_started`, `tool_completed`), and render the outcome inline.

---

## 6. Customising Tool Display Labels & UI Modes in Chat

When an agent invokes a tool, the chat UI renders an execution step inside the **Chain of Thought** accordion.

To support dynamic user-created tools and rich Generative UI components, tool definitions store display properties directly in the database (`AgentTool` model in `apps/api/modules/agents/models.py`):

```python
class AgentTool(Base):
    ...
    ui_mode: Mapped[str] = mapped_column(
        String(32), default="inline", nullable=False,
        comment="UI placement: 'collapsible' (inside ChainOfThought step), 'inline' (main chat body card), or 'both'"
    )
    display_label_running: Mapped[Optional[str]] = mapped_column(
        String(120), nullable=True, default=None,
        comment="Human-readable label shown in chat while executing. E.g. 'Finding weather...'"
    )
    display_label_completed: Mapped[Optional[str]] = mapped_column(
        String(120), nullable=True, default=None,
        comment="Human-readable label shown in chat after completion. E.g. 'Found weather'"
    )
```

### Tool UI Placement Modes (`ui_mode`)

| `ui_mode` | Primary Use Case | Rendering Behavior |
| :--- | :--- | :--- |
| **`inline`** (default for widgets) | Rich interactive widgets (`get_weather`, `get_stock_price`) | Summary step recorded in `ChainOfThought`; visual widget rendered **inline in the main chat body** for maximum visibility. |
| **`collapsible`** (default for utility) | Background execution (`search_web`, `read_file`) | Output log and parameters kept **inside the `ChainOfThought` step**. Main chat stream remains clean. |
| **`both`** | Debugging / Hybrid cards | Widget rendered inside the `ChainOfThought` step AND inline in the main chat body. |

### Dynamic Fallback Rendering Pipeline (For Undefined Tools)

When a new tool is created without a custom React/React Native component registered for its `name`, the UI automatically renders its output using a **3-Level Fallback Pipeline**:

```
Does the tool match a custom component? (e.g. get_weather)
   ├── YES ──> Render registered rich component (<WeatherCard />, <StockWidget />)
   │
   └── NO  ──> Is the output valid JSON?
               ├── YES (Object) ──> Level 1: Auto-Generated Key-Value Data Card 📋
               ├── YES (Array)  ──> Level 2: Auto-Generated Data Table Grid 📊
               └── NO  (Text)   ──> Level 3: Formatted Monospaced Block 💻
```

1. **Level 1 (Key-Value Data Card)**: Any new tool returning JSON automatically renders a clean 2-column key-value grid (e.g. `{"monthly_payment": "$2,400", "rate": "5.5%"}`).
2. **Level 2 (Data Table Grid)**: Arrays of objects automatically render as tabular grids.
3. **Level 3 (Monospaced Block)**: Raw text or error tracebacks render in a clean collapsible monospaced block.

---


## 7. Tool Approval Gate (Human-in-the-Loop)

Certain tool calls carry side effects that should not execute without explicit human confirmation — creating records, charging customers, sending notifications, or modifying external systems. The **Tool Approval Gate** lets you require user approval before a tool executes, directly in the chat UI, without any extra LLM roundtrip.

### How It Works

When `require_approval=True` and the calling user's role is in the gated list, the agent loop pauses after emitting `tool_approval_requested`. The chat UI shows an approval card. The user clicks Approve or Reject; the decision is sent back via WebSocket (`tool_approval` message); the loop resumes and either executes the tool or injects a rejection result — no extra LLM call is ever made.

### Enabling the Gate on a Tool

Toggle **Require User Approval** in the Admin Panel (`/dashboard/admin/tools`). Optionally select which roles are gated via `approval_required_for_roles`:

| `require_approval` | `approval_required_for_roles` | Owner | Admin | Member | Viewer |
|---|---|---|---|---|---|
| `True` | `null` / `[]` (default) | Gated | Gated | Gated | Gated |
| `True` | `["member", "viewer"]` | Bypass | Bypass | Gated | Gated |
| `True` | `["member"]` | Bypass | Bypass | Gated | Bypass |
| `False` | _(ignored)_ | Bypass | Bypass | Bypass | Bypass |

**Recommended**: `["member", "viewer"]` — lets trusted admins work uninterrupted while gating regular users.

### Backend Model Fields

```python
class AgentTool(Base):
    require_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approval_required_for_roles: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
```

### WebSocket Protocol

| Direction | Event | When |
|---|---|---|
| Server → Client | `tool_approval_requested` | Tool paused, awaiting decision |
| Client → Server | `tool_approval` | User approves or rejects |
| Server → Client | `tool_denied` | Tool rejected or timed out (5 min) |

After rejection, the LLM receives a `tool` role message with the rejection text and responds naturally.

### Audit Trail

`AgentToolRun` columns `approval_status` (`"approved"` / `"rejected"` / `null`) and `approved_by` (Firebase UID) are set on every gated execution. Visible in the Admin Tools monitoring table.

### When to Use `require_approval`

Use for any tool with **irreversible external side effects**: deleting records, financial transactions, sending notifications, writing to external APIs. Do NOT use for read-only queries.

---
