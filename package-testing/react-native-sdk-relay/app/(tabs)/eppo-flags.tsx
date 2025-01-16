import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import Code = TypeCompiler.Code;
import EppoFlagKeyDump from '@/components/EppoFlagKeyDump';

export default function EppoFlagsScreen() {
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
        <ThemedText type="title">Eppo Flag Assignments</ThemedText>
      </ThemedView>
      <ThemedText>Get dynamic values for your app based on your Eppo Experiments and Feature Flags.</ThemedText>
      <Collapsible title="Assignment Methods">
        <ThemedText>
          <pre>
            getBooleanAssignment(...) getNumericAssignment(...) getIntegerAssignment(...) getStringAssignment(...)
            getJSONAssignment(...)
          </pre>
        </ThemedText>
        <ExternalLink href="https://docs.geteppo.com/sdks/client-sdks/react-native/" target="_blank">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Flag Keys">
        <ThemedText>These flags have been loaded by the traditional Eppo SDK.</ThemedText>
        <ThemedText type="defaultSemiBold">They are probably hashed.</ThemedText>
        <EppoFlagKeyDump></EppoFlagKeyDump>
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
