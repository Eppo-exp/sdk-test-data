import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEffect, useState } from 'react';
import { getInstance } from '@eppo/react-native-sdk';
import { useSubjectAttributes } from '@/hooks/useSubjectAttributes';
import { useEppoPrecomputedClient } from '@/hooks/useEppoPrecomputedClient';

export default function BanditTabScreen() {
  const [updateHighlightsBanditVariation, setUpdateHighlightsBanditVariation] = useState<string>('LOADING...');
  const [updateHighlightsBanditAction, setUpdateHighlightsBanditAction] = useState<string>('');

  const [updateHighlightsFlagValue, setUpdateHighlightsFlagValue] = useState<string>('LOADING...');
  const [precomputedFlagValue, setPrecomputedFlagValue] = useState<string>('LOADING...');

  const subjectAttributes = useSubjectAttributes();
  const client = useEppoPrecomputedClient();

  // const client = useEppoPrecomputedClient();

  useEffect(() => {
    try {
      const result = client.getBanditAction('update-highlights-bandit', 'NONE');

      setUpdateHighlightsBanditVariation(result?.variation ?? 'ERROR');
      setUpdateHighlightsBanditAction(result?.action ?? 'ERROR');

      const flagResult = getInstance().getStringAssignment(
        'update-highlights-bandit',
        'user123',
        subjectAttributes,
        'NONE',
      );
      setUpdateHighlightsFlagValue(flagResult);

      const precomputedFlagResult = client.getStringAssignment('update-highlights-bandit', 'NONE');
      setPrecomputedFlagValue(precomputedFlagResult);
    } catch (error) {
      console.error('Error in bandit effect:', error);
      setUpdateHighlightsBanditVariation('ERROR');
      setUpdateHighlightsBanditAction('ERROR');
    }
  }, [client, subjectAttributes]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bandits</ThemedText>
      </ThemedView>
      <ThemedText>Here we are seeing the first bandits on a mobile app!</ThemedText>
      <Collapsible title="update-highlights-bandit">
        <ThemedText>
          <ThemedText type="defaultSemiBold">VariationValue</ThemedText>{' '}
          <ThemedText>{updateHighlightsBanditVariation}</ThemedText>
        </ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">Bandit Value</ThemedText>{' '}
          <ThemedText>{updateHighlightsBanditAction}</ThemedText>
        </ThemedText>
      </Collapsible>
      <Collapsible title="update-highlights-bandit Flag Value">
        <ThemedText>
          <ThemedText type="defaultSemiBold">Traditional Client</ThemedText>{' '}
          <ThemedText>{updateHighlightsFlagValue}</ThemedText>
        </ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">Precomputed Client</ThemedText>{' '}
          <ThemedText>{precomputedFlagValue}</ThemedText>
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
