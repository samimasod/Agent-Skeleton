import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bot, User, Send, ChevronLeft, ChevronDown, Search, Terminal, Brain, CheckCircle, Wrench } from 'lucide-react-native';
import { agentsApi } from '@/lib/api-client';
import { AgentChatWebSocket } from '@/lib/ws-client';
import { useTheme } from '@/providers/theme-provider';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { GenerativeToolUi, toolDisplayLabels, getToolLabels } from '../components/tools';

// ─── Thinking block parser ────────────────────────────────────────────────────
function parseThinkingContent(content: string): { thinking: string | null; body: string } {
  if (!content) return { thinking: null, body: '' };
  const thinkTagRegex = /<think>([\s\S]*?)<\/think>([\s\S]*)$/;
  const matchTag = content.match(thinkTagRegex);
  if (matchTag) return { thinking: matchTag[1].trim(), body: matchTag[2].trim() };
  const mdRegex = /^\*\(thinking:\s*([\s\S]*?)\)\*\s*\n*([\s\S]*)$/;
  const matchMd = content.match(mdRegex);
  if (matchMd) return { thinking: matchMd[1].trim(), body: matchMd[2].trim() };
  return { thinking: null, body: content };
}

// ─── Turn Grouping Logic ──────────────────────────────────────────────────────
interface Turn {
  id: string | number;
  role: 'user' | 'system' | 'assistant';
  content?: string;
  thinking?: string | null;
  body?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, any>;
    completion?: { content: string };
  }>;
}

function groupMessagesIntoTurns(msgs: any[]): Turn[] {
  const turns: Turn[] = [];

  for (const msg of msgs) {
    if (msg.role === 'system') {
      turns.push({ id: msg.id, role: 'system', content: msg.content });
    } else if (msg.role === 'user') {
      turns.push({ id: msg.id, role: 'user', content: msg.content });
    } else if (msg.role === 'assistant' || msg.role === 'tool') {
      let lastTurn = turns[turns.length - 1];
      if (!lastTurn || lastTurn.role !== 'assistant') {
        lastTurn = {
          id: msg.id,
          role: 'assistant',
          thinking: null,
          body: '',
          toolCalls: [],
        };
        turns.push(lastTurn);
      }

      if (msg.role === 'assistant') {
        if (msg.content) {
          const parsed = parseThinkingContent(msg.content);
          if (parsed.thinking) {
            lastTurn.thinking = lastTurn.thinking
              ? `${lastTurn.thinking}\n${parsed.thinking}`
              : parsed.thinking;
          }
          if (parsed.body) {
            lastTurn.body = lastTurn.body
              ? `${lastTurn.body}\n${parsed.body}`
              : parsed.body;
          }
        }
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls as any[]) {
            let parsedArgs: Record<string, any> = {};
            try {
              parsedArgs =
                typeof tc.function.arguments === 'string'
                  ? JSON.parse(tc.function.arguments)
                  : tc.function.arguments;
            } catch (_) {}

            const existing = lastTurn.toolCalls!.find((t) => t.id === tc.id);
            if (!existing) {
              lastTurn.toolCalls!.push({
                id: tc.id,
                name: tc.function?.name || tc.name || '',
                args: parsedArgs,
              });
            }
          }
        }
      } else if (msg.role === 'tool') {
        const existingTool = lastTurn.toolCalls!.find(
          (t) => t.id === msg.tool_call_id
        );
        if (existingTool) {
          existingTool.completion = { content: msg.content || '' };
        } else {
          lastTurn.toolCalls!.push({
            id: msg.tool_call_id || String(msg.id),
            name: msg.name || '',
            args: {},
            completion: { content: msg.content || '' },
          });
        }
      }
    }
  }

  return turns;
}

// ─── Native ChainOfThought Component Family ──────────────────────────────────
function ChainOfThought({
  title = 'Chain of Thought',
  defaultOpen = false,
  children,
  colors,
}: {
  title?: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  colors: any;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View className="my-1 rounded-xl border border-border bg-card overflow-hidden w-full">
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-3 py-2.5"
      >
        <View className="flex-row items-center gap-2 flex-1">
          <Brain size={14} color={colors.mutedForeground} />
          <Text className="text-xs font-medium text-muted-foreground flex-1" numberOfLines={1}>
            {title}
          </Text>
        </View>
        <ChevronDown
          size={14}
          color={colors.mutedForeground}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {open && children != null && (
        <View className="px-3 pb-3 pt-1 border-t border-border/40 gap-3">
          {children}
        </View>
      )}
    </View>
  );
}

function ChainOfThoughtStep({
  icon: Icon = Brain,
  title,
  status = 'done',
  isLast = false,
  collapsible = false,
  children,
  colors,
}: {
  icon?: any;
  title: string;
  status?: 'running' | 'done' | 'error';
  isLast?: boolean;
  collapsible?: boolean;
  children?: React.ReactNode;
  colors: any;
}) {
  const [expanded, setExpanded] = useState(!collapsible);

  const toggle = () => {
    if (!collapsible) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const nodeBorderColor =
    status === 'running' ? 'border-primary bg-primary/10' :
    status === 'error'   ? 'border-destructive bg-destructive/10' :
    'border-border bg-muted/60';

  const iconColor =
    status === 'running' ? colors.primary :
    status === 'error'   ? colors.destructive :
    colors.mutedForeground;

  return (
    <View className="flex-row gap-3">
      {/* Timeline left column with circular node & connecting line */}
      <View className="items-center">
        <View className={`w-6 h-6 rounded-full items-center justify-center border ${nodeBorderColor}`}>
          {status === 'running' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon size={12} color={iconColor} />
          )}
        </View>
        {!isLast && (
          <View className="w-[1.5px] flex-1 bg-border/60 my-1" />
        )}
      </View>

      {/* Timeline right content column */}
      <View className="flex-1 pb-3">
        <TouchableOpacity
          onPress={toggle}
          disabled={!collapsible}
          activeOpacity={0.7}
          className="flex-row items-center justify-between py-0.5"
        >
          <Text className="text-xs font-semibold text-foreground flex-1">{title}</Text>
          {collapsible && (
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px] text-muted-foreground">{expanded ? 'Hide' : 'Show'}</Text>
              <ChevronDown
                size={12}
                color={colors.mutedForeground}
                style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
              />
            </View>
          )}
        </TouchableOpacity>

        {expanded && children != null && (
          <View className="mt-1">{children}</View>
        )}
      </View>
    </View>
  );
}

// ─── Argument list (key: value rows) ─────────────────────────────────────────
function ArgList({ args }: { args: Record<string, any> }) {
  return (
    <View className="mt-1 gap-1">
      {Object.entries(args).map(([key, val]) => (
        <View key={key} className="flex-row gap-1.5">
          <Text className="text-[11px] font-semibold text-foreground capitalize">{key}:</Text>
          <Text className="text-[11px] text-muted-foreground flex-1">
            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AgentChatScreen() {
  const { agentId, agentName } = useLocalSearchParams<{ agentId: string; agentName: string }>();
  const parsedAgentId = parseInt(agentId || '', 10);
  const router = useRouter();
  const { colors } = useTheme();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [streamingTools, setStreamingTools] = useState<Record<string, {
    toolName: string;
    arguments: any;
    output?: string;
    error?: string;
    status: 'running' | 'success' | 'error';
  }>>({});

  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  const handleLoadOlderMessages = async () => {
    if (!activeSessionId || !hasMoreMessages || isLoadingOlderMessages) return;
    setIsLoadingOlderMessages(true);
    try {
      const nextPage = messagesPage + 1;
      const thread = await agentsApi.getSessionMessages(activeSessionId, nextPage, 20);
      setMessages((prev) => [...(thread.messages || []), ...prev]);
      setMessagesPage(nextPage);
      setHasMoreMessages(thread.has_more ?? false);
    } catch (err) {
      console.error('Failed to load older messages on mobile:', err);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const wsClientRef = useRef<AgentChatWebSocket | null>(null);
  const flatListRef = useRef<FlatList | null>(null);

  const initChatSession = async () => {
    setIsLoading(true);
    try {
      const sessionsData = await agentsApi.listSessions(parsedAgentId, 1, 20);
      let sessionId = '';
      if (sessionsData.sessions.length > 0) {
        sessionId = sessionsData.sessions[0].id;
        setActiveSessionId(sessionId);
        try {
          const thread = await agentsApi.getSessionMessages(sessionId, 1, 20);
          setMessages(thread.messages || []);
          setMessagesPage(1);
          setHasMoreMessages(thread.has_more ?? false);
        } catch {
          setMessages([]);
          setHasMoreMessages(false);
        }
      }

      const socket = new AgentChatWebSocket(
        parsedAgentId,
        {
          onOpen: () => setWsConnected(true),
          onClose: () => setWsConnected(false),
          onSessionCreated: (createdSessionId, history) => {
            setActiveSessionId(createdSessionId);
            if (history && history.length > 0) setMessages(history);
          },
          onTextDelta: (text) => {
            setMessages((prev) => {
              const list = [...prev];
              const last = list[list.length - 1];
              if (last && last.role === 'assistant' && !last.tool_calls) {
                list[list.length - 1] = { ...last, content: (last.content || '') + text };
                return list;
              }
              return [...prev, { id: Math.random().toString(), role: 'assistant', content: text, created_at: new Date().toISOString() }];
            });
          },
          onToolStarted: (toolCallId, toolName, args) => {
            setStreamingTools((prev) => ({
              ...prev,
              [toolCallId]: { toolName, arguments: args, status: 'running' },
            }));
          },
          onToolCompleted: (toolCallId, toolName, output, error) => {
            setStreamingTools((prev) => ({
              ...prev,
              [toolCallId]: { ...prev[toolCallId], output, error, status: error ? 'error' : 'success' },
            }));
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                role: 'tool',
                content: output || error,
                tool_call_id: toolCallId,
                name: toolName,
                created_at: new Date().toISOString(),
              },
            ]);
          },
          onMessageCompleted: () => setStreamingTools({}),
          onError: (msg) => {
            setMessages((prev) => [
              ...prev,
              { id: Math.random().toString(), role: 'system', content: `Error: ${msg}`, created_at: new Date().toISOString() },
            ]);
            setStreamingTools({});
          },
        },
        sessionId || undefined
      );

      wsClientRef.current = socket;
      await socket.connect();
    } catch (err) {
      console.error('Failed to init mobile chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void initChatSession();
    return () => { wsClientRef.current?.disconnect(); };
  }, [parsedAgentId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !wsClientRef.current || !wsConnected) return;
    const userText = inputText;
    setInputText('');
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(), role: 'user', content: userText, created_at: new Date().toISOString() },
    ]);
    wsClientRef.current.sendMessage(userText);
  };

  const renderMessageList = () => {
    const turns = groupMessagesIntoTurns(messages);

    return turns.map((turn) => {
      if (turn.role === 'system') {
        return (
          <View key={turn.id} className="items-center my-2 px-6">
            <View className="rounded-lg bg-destructive/10 px-3 py-1.5 border border-destructive/20">
              <Text className="text-xs text-destructive text-center font-bold">{turn.content}</Text>
            </View>
          </View>
        );
      }

      if (turn.role === 'user') {
        return (
          <View key={turn.id} className="flex-row gap-3 my-2 items-end justify-end">
            <View className="rounded-2xl px-4 py-2.5 max-w-[75%] bg-primary rounded-tr-none">
              <Text className="text-sm leading-relaxed text-primary-foreground">
                {turn.content}
              </Text>
            </View>
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center border border-border">
              <User size={16} color={colors.primaryForeground} />
            </View>
          </View>
        );
      }

      // Assistant turn
      const hasThinking = !!turn.thinking;
      const hasTools = !!(turn.toolCalls && turn.toolCalls.length > 0);
      const hasChainOfThought = hasThinking || hasTools;

      return (
        <View key={turn.id} className="flex-row gap-3 my-2 items-end justify-start">
          <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center border border-border">
            <Bot size={16} color={colors.foreground} />
          </View>
          <View className="max-w-[80%] items-start">
            {hasChainOfThought && (
              <ChainOfThought title="Chain of Thought" defaultOpen={false} colors={colors}>
                {hasThinking && (
                  <ChainOfThoughtStep
                    icon={Brain}
                    title="Reasoning Process"
                    colors={colors}
                    isLast={!hasTools}
                    collapsible={true}
                  >
                    <Text className="text-xs text-muted-foreground mt-1 bg-muted/40 p-2.5 rounded-lg leading-relaxed font-mono">
                      {turn.thinking}
                    </Text>
                  </ChainOfThoughtStep>
                )}

                {hasTools && turn.toolCalls!.map((tc, tIdx) => {
                  const toolCfg = (toolDisplayLabels as any)[tc.name] || {};
                  const labels = {
                    running: toolCfg.running || `Running Tool: ${tc.name}`,
                    completed: toolCfg.completed || `Executed Tool: ${tc.name}`
                  };
                  const mode: 'collapsible' | 'inline' | 'both' = toolCfg.mode || (tc.name === 'get_weather' || tc.name === 'get_stock_price' ? 'inline' : 'collapsible');
                  const isCompleted = !!tc.completion;
                  const isLastTool = tIdx === turn.toolCalls!.length - 1;

                  return (
                    <ChainOfThoughtStep
                      key={tIdx}
                      icon={isCompleted ? CheckCircle : Wrench}
                      title={isCompleted ? labels.completed : labels.running}
                      status={isCompleted ? 'done' : 'running'}
                      colors={colors}
                      isLast={isLastTool}
                      collapsible={false}
                    >
                      <ArgList args={tc.args} />
                      {isCompleted && (mode === 'collapsible' || mode === 'both') && (
                        <View className="mt-2 pt-2 border-t border-border/40">
                          <GenerativeToolUi name={tc.name} content={tc.completion!.content} colors={colors} />
                        </View>
                      )}
                    </ChainOfThoughtStep>
                  );
                })}
              </ChainOfThought>
            )}

            {/* Inline Generative UI Widgets */}
            {hasTools && turn.toolCalls!.map((tc, tIdx) => {
              const toolCfg = (toolDisplayLabels as any)[tc.name] || {};
              const mode: 'collapsible' | 'inline' | 'both' = toolCfg.mode || (tc.name === 'get_weather' || tc.name === 'get_stock_price' ? 'inline' : 'collapsible');
              if (tc.completion && (mode === 'inline' || mode === 'both')) {
                return (
                  <View key={tIdx} className="w-full">
                    <GenerativeToolUi name={tc.name} content={tc.completion.content} colors={colors} />
                  </View>
                );
              }
              return null;
            })}

            {turn.body ? (
              <View className="rounded-2xl px-4 py-2.5 bg-card border border-border rounded-tl-none mt-1">
                <Text className="text-sm leading-relaxed text-foreground">
                  {turn.body}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    });
  };

  const renderActiveStreamingTools = () => {
    const list = Object.entries(streamingTools);
    if (list.length === 0) return null;

    return (
      <View className="px-4 pb-3 pt-2 bg-card border-t border-border gap-2">
        <ChainOfThought title="Active Execution Steps" defaultOpen={true} colors={colors}>
          {list.map(([id, t]) => {
            const labels = getToolLabels(t.toolName);
            const title =
              t.status === 'running'  ? labels.running :
              t.status === 'error'    ? `Error: ${t.toolName}` :
              labels.completed;

            return (
              <ChainOfThoughtStep
                key={id}
                icon={t.status === 'running' ? Search : t.status === 'error' ? Wrench : CheckCircle}
                title={title}
                status={t.status === 'success' ? 'done' : t.status}
                colors={colors}
              >
                <ArgList args={t.arguments} />
                {t.output && (
                  <View className="mt-2 pt-2 border-t border-border/40">
                    <GenerativeToolUi name={t.toolName} content={t.output} colors={colors} />
                  </View>
                )}
                {t.error && (
                  <View className="mt-2 bg-destructive/10 rounded-xl p-2 border border-destructive/20">
                    <Text className="text-[11px] text-destructive font-mono">{t.error}</Text>
                  </View>
                )}
              </ChainOfThoughtStep>
            );
          })}
        </ChainOfThought>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1">
          <ChevronLeft size={20} color={colors.foreground} />
          <Text className="text-sm font-bold text-foreground">Back</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-bold text-foreground">{agentName}</Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <View className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-primary' : 'bg-destructive'}`} />
            <Text className="text-[10px] text-muted-foreground font-semibold">
              {wsConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>
        <View className="w-12" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={[{ id: '__list__' }]}
          ListHeaderComponent={
            hasMoreMessages ? (
              <View className="items-center py-2">
                <TouchableOpacity
                  onPress={handleLoadOlderMessages}
                  disabled={isLoadingOlderMessages}
                  className="px-4 py-2 rounded-full bg-muted border border-border flex-row items-center gap-2"
                >
                  {isLoadingOlderMessages ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                  <Text className="text-xs font-semibold text-foreground">Load Older Messages</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={() => (
            <View className="px-4 py-3">
              {messages.length === 0 ? (
                <View className="flex-1 items-center justify-center mt-20 opacity-60 px-6">
                  <Terminal size={32} color={colors.mutedForeground} />
                  <Text className="text-sm font-bold text-foreground mt-3">Conversational Interface</Text>
                  <Text className="text-xs text-muted-foreground text-center mt-1">
                    Your chat queries are streamed in real time. Custom agent tools are executed dynamically.
                  </Text>
                </View>
              ) : (
                renderMessageList()
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {renderActiveStreamingTools()}

        {/* Input Bar */}
        <View className="flex-row items-center p-3 border-t border-border bg-card gap-2.5">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={wsConnected ? 'Type a message...' : 'Connecting to chat stream...'}
            editable={wsConnected}
            className="flex-1 bg-muted px-4 py-2.5 rounded-full text-foreground text-sm border border-border"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!wsConnected || !inputText.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              wsConnected && inputText.trim() ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Send size={16} color={wsConnected && inputText.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
