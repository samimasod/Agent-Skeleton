import React from 'react';
import { View, Text } from 'react-native';

export interface ToolDisplayConfig {
  running: string;
  completed: string;
  mode?: 'collapsible' | 'inline' | 'both';
}

export const toolDisplayLabels: Record<string, ToolDisplayConfig> = {
  get_weather: { running: 'Finding weather...', completed: 'Found weather', mode: 'inline' },
  get_stock_price: { running: 'Fetching market price...', completed: 'Retrieved stock price', mode: 'inline' },
  calculate_mortgage: { running: 'Calculating mortgage payments...', completed: 'Mortgage calculated', mode: 'inline' },
  search_web: { running: 'Searching the web...', completed: 'Web search complete', mode: 'collapsible' },
  read_file: { running: 'Reading file contents...', completed: 'File read successfully', mode: 'collapsible' },
  fetch_user_profile: { running: 'Fetching user profile...', completed: 'Profile loaded', mode: 'both' },
};

export function getToolLabels(name: string) {
  return toolDisplayLabels[name] || {
    running: `Running Tool: ${name}`,
    completed: `Executed Tool: ${name}`,
    mode: 'collapsible' as const,
  };
}

export function WeatherCard({ data }: { data: any }) {
  return (
    <View className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-sm font-bold text-foreground">{data.city || 'Location'}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{data.condition || 'Clear'}</Text>
        </View>
        <Text className="text-lg">☀️</Text>
      </View>
      <Text className="text-2xl font-extrabold text-foreground mt-3">{data.temperature || '20°C'}</Text>
      <View className="flex-row justify-between mt-4 pt-3 border-t border-border/50">
        <View>
          <Text className="text-[10px] text-muted-foreground font-semibold">Humidity</Text>
          <Text className="text-xs font-bold text-foreground mt-0.5">{data.humidity || '50%'}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-muted-foreground font-semibold">Wind</Text>
          <Text className="text-xs font-bold text-foreground mt-0.5">{data.wind || '10 km/h'}</Text>
        </View>
      </View>
    </View>
  );
}

export function StockWidget({ data }: { data: any }) {
  const isPositive = !data.change?.toString().startsWith('-');
  return (
    <View className="mt-2 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-xs font-bold uppercase text-muted-foreground">{data.symbol || 'AAPL'}</Text>
          <Text className="text-sm font-semibold text-foreground mt-0.5">{data.company || 'Company'}</Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${isPositive ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          <Text className={`text-[10px] font-bold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{data.change || '0.0%'}
          </Text>
        </View>
      </View>
      <Text className="text-2xl font-extrabold text-foreground mt-3">${data.price || '150.00'}</Text>
    </View>
  );
}

export function KeyValueDataCard({ name, data }: { name: string; data: Record<string, any> }) {
  return (
    <View className="mt-2 rounded-xl border border-border bg-card p-3 w-full">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b border-border/40">
        {name.replace(/_/g, ' ')} Result
      </Text>
      <View className="gap-1.5">
        {Object.entries(data).map(([key, val]) => (
          <View key={key} className="flex-row justify-between items-center py-0.5 border-b border-border/20">
            <Text className="text-xs font-semibold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</Text>
            <Text className="text-xs font-mono text-foreground font-medium ml-2">
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function GenerativeToolUi({ name, content, colors }: { name: string; content: string; colors?: any }) {
  try {
    const data = JSON.parse(content);
    if (name === 'get_weather') {
      return <WeatherCard data={data} />;
    }
    if (name === 'get_stock_price') {
      return <StockWidget data={data} />;
    }
    if (typeof data === 'object' && data !== null) {
      return <KeyValueDataCard name={name} data={data} />;
    }
  } catch (_) {}

  return (
    <View className="mt-2 bg-muted p-2.5 rounded-xl border border-border">
      <Text className="text-[10px] text-muted-foreground font-mono" numberOfLines={8}>{content}</Text>
    </View>
  );
}
