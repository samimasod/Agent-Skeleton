import React from 'react';
import { View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

export interface AttachmentItem {
  id: string;
  name: string;
  url?: string;
  type: string; // 'image' | 'file'
  progress?: number; // 0 to 100
  error?: string;
}

interface MobileAttachmentsProps {
  items: AttachmentItem[];
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

export function MobileAttachments({ items, onRemove, readOnly = false }: MobileAttachmentsProps) {
  const { colors } = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
      className="max-h-24 my-2"
    >
      {items.map((item) => {
        const isImage = item.type.startsWith('image') || !!item.url;
        const isUploading = item.progress !== undefined && item.progress < 100;

        return (
          <View 
            key={item.id}
            className="flex-row items-center bg-card border border-border rounded-xl p-2 pr-3 min-w-[120px] max-w-[200px]"
          >
            {/* Preview Thumbnail */}
            <View className="w-10 h-10 rounded-lg bg-muted items-center justify-center overflow-hidden mr-2 shrink-0">
              {isImage && item.url ? (
                <Image source={{ uri: item.url }} className="w-full h-full" />
              ) : isImage ? (
                <ImageIcon size={18} color={colors.mutedForeground} />
              ) : (
                <FileText size={18} color={colors.primary} />
              )}
            </View>

            {/* Details */}
            <View className="flex-1 mr-1">
              <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                {item.name}
              </Text>
              
              {isUploading ? (
                <View className="flex-row items-center mt-0.5 gap-1">
                  <Loader2 size={10} color={colors.primary} className="animate-spin" />
                  <Text className="text-[10px] text-primary">{item.progress}%</Text>
                </View>
              ) : item.error ? (
                <Text className="text-[10px] text-destructive" numberOfLines={1}>
                  Error
                </Text>
              ) : (
                <Text className="text-[10px] text-muted-foreground uppercase">
                  {item.type.split('/')[1] || item.type}
                </Text>
              )}
            </View>

            {/* Remove Action Button */}
            {!readOnly && onRemove && (
              <TouchableOpacity 
                onPress={() => onRemove(item.id)}
                className="w-5 h-5 rounded-full bg-muted/80 items-center justify-center active:bg-muted"
              >
                <X size={12} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
