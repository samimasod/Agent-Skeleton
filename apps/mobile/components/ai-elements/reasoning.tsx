import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text } from '@/components/ui/text';
import { Brain, ChevronDown, ChevronUp, CheckCircle, Loader2 } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MobileReasoningProps {
  reasoning: string;
  isThinking?: boolean;
  durationMs?: number;
}

export function MobileReasoning({ reasoning, isThinking = false, durationMs }: MobileReasoningProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning && !isThinking) return null;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const getDurationText = () => {
    if (!durationMs) return '';
    return `for ${(durationMs / 1000).toFixed(1)}s`;
  };

  return (
    <View className="my-2 border border-border bg-muted/40 rounded-2xl overflow-hidden max-w-[85%]">
      {/* Accordion Trigger */}
      <TouchableOpacity 
        onPress={toggleExpand}
        className="flex-row items-center justify-between p-3.5 bg-card border-b border-border active:opacity-85"
      >
        <View className="flex-row items-center gap-2 flex-1">
          {isThinking ? (
            <Loader2 size={16} color={colors.primary} className="animate-spin" />
          ) : (
            <CheckCircle size={16} color={colors.primary} />
          )}
          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
            <Brain size={15} color={colors.mutedForeground} />
            <Text className="text-xs font-bold text-foreground">
              {isThinking ? 'Agent is thinking...' : `Thought process ${getDurationText()}`}
            </Text>
          </View>
        </View>
        
        {isExpanded ? (
          <ChevronUp size={16} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={16} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>

      {/* Accordion Expandable Content */}
      {isExpanded && (
        <View className="p-4 bg-muted/20">
          <Text className="text-[11px] leading-relaxed text-muted-foreground font-mono">
            {reasoning}
          </Text>
        </View>
      )}
    </View>
  );
}
