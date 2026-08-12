import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

interface MobileVoiceIndicatorProps {
  isActive?: boolean;
}

export function MobileVoiceIndicator({ isActive = false }: MobileVoiceIndicatorProps) {
  const { colors } = useTheme();
  
  // Waveform bar heights/scales anims
  const anims = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  useEffect(() => {
    if (!isActive) {
      anims.forEach((anim) => anim.setValue(1));
      return;
    }

    const loops = anims.map((anim, idx) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.5 + Math.random() * 2,
            duration: 250 + idx * 60,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.8 + Math.random() * 0.4,
            duration: 250 + idx * 60,
            useNativeDriver: true,
          }),
        ])
      );
    });

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [isActive]);

  return (
    <View className="flex-row items-center justify-center gap-3.5 py-4">
      {/* Outer mic button */}
      <View 
        className={`w-14 h-14 rounded-full items-center justify-center border border-border shadow-sm bg-card ${
          isActive ? 'border-primary/45 shadow-primary/20' : ''
        }`}
      >
        <Mic size={22} color={isActive ? colors.primary : colors.mutedForeground} />
      </View>

      {/* Pulsing bars indicator */}
      {isActive && (
        <View className="flex-row items-center gap-1.5 h-10 px-2">
          {anims.map((anim, idx) => (
            <Animated.View
              key={idx}
              style={{
                transform: [{ scaleY: anim }],
              }}
              className="w-1 h-4 rounded bg-primary"
            />
          ))}
        </View>
      )}
    </View>
  );
}
