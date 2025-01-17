import { useEffect, useState } from 'react';
import { getInstance } from '@eppo/react-native-sdk';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface IEppoFlagKeyDumpProps {}
export default function EppoFlagKeyDump(props: IEppoFlagKeyDumpProps) {
  const [flagKeys, setFlagKeys] = useState<string[]>([]);

  useEffect(() => {
    setFlagKeys(getInstance().getFlagKeys());
  }, []);

  return (
    <ThemedView>
      {flagKeys.map((flagKey) => (
        <ThemedText className="eppo-flag" key={flagKey}>
          <ThemedText>{flagKey}</ThemedText>
        </ThemedText>
      ))}
    </ThemedView>
  );
}
