import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import React from 'react';

export function LoadingPlaceholder() {
  return (
    <ThemedView>
      <ThemedText>Loading...</ThemedText>
    </ThemedView>
  );
}
