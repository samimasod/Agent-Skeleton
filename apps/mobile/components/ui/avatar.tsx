import * as React from 'react';
import { View, Image, Text } from 'react-native';
import { cn } from '@/lib/utils';

export function Avatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted', className)}>
      {children}
    </View>
  );
}

export function AvatarImage({ source, className }: { source: { uri: string }; className?: string }) {
  if (!source.uri) return null;
  return (
    <Image source={source} className={cn('h-full w-full aspect-square', className)} />
  );
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)}>
      {typeof children === 'string' ? (
        <Text className="text-xs font-medium text-muted-foreground uppercase">
          {children.substring(0, 2)}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
