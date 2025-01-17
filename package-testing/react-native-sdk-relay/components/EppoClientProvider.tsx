import React, { useEffect, useMemo, useState } from 'react';
import { init, IPrecomputedClientConfig, precomputedInit } from '@eppo/react-native-sdk';
import {
  Attributes,
  BanditActions,
  ContextAttributes,
  IAssignmentEvent,
  IAssignmentLogger,
  IBanditEvent,
  IBanditLogger,
} from '@eppo/js-client-sdk-common';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';
import { Platform } from 'react-native';

interface IEppoClientProvider {
  waitForInitialization?: boolean;
  children: JSX.Element;
  loadingComponent?: JSX.Element;
}

const sdkKey = process.env.EXPO_PUBLIC_EPPO_SDK_KEY ?? '<YOUR-SDK-KEY>';

/**
 * Logs assignments to the console
 */
const assignmentLogger: IAssignmentLogger = {
  logAssignment(assignment: IAssignmentEvent) {
    console.log(assignment);
  },
};

const DOGFOOD_BANDIT_FUNCTION_URI_ROOT = 'https://us-central1-eppo-qa.cloudfunctions.net/java-http-function';

const subjectKey = 'user123';
const subjectAttributes: Attributes = {
  platform: Platform.select({ web: 'web', ios: 'mobile', android: 'mobile' }) ?? 'unknown',
};

const highlightUpdateActions: Record<string, ContextAttributes> = Object.fromEntries(
  Object.entries({
    greenDot: { type: 'dot', color: 'green' },
    greenText: { type: 'text', color: 'green' },
    greenBackground: { type: 'background', color: 'green' },
    emojiSparkle: { type: 'emoji', color: 'yellow' },
  }).map(([key, value]) => {
    return [key, { categoricalAttributes: value, numericAttributes: {} }];
  }),
);

const banditActions: Record<string, Record<string, ContextAttributes>> = {
  'update-highlights-bandit': highlightUpdateActions,
};

const simpleBanditActions = ['greenDot'];
/**
 * Subject
 * @param waitForInitialization
 * @param children
 * @param loadingComponent
 * @constructor
 */

export default function EppoClientProvider({
  waitForInitialization = true,
  children,
  loadingComponent = <LoadingPlaceholder />,
}: IEppoClientProvider): JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);

  const banditLogger: IBanditLogger = useMemo(
    () => ({
      logBanditAction(assignment: IBanditEvent) {
        console.debug('logBanditAction', assignment);

        fetch(`${DOGFOOD_BANDIT_FUNCTION_URI_ROOT}/log_bandit_assignment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            featureFlag: assignment.featureFlag,
            bandit: assignment.bandit,
            subject: subjectKey,
            action: assignment.action,
            actionProbability: assignment.actionProbability,
            optimalityGap: assignment.optimalityGap,
            modelVersion: assignment.modelVersion,

            subjectNumericAttributes: subjectAttributes.numericAttributes,
            subjectCategoricalAttributes: subjectAttributes.categoricalAttributes,
            actionNumericAttributes: assignment.actionNumericAttributes,
            actionCategoricalAttributes: assignment.actionCategoricalAttributes,
          }),
        });
      },
    }),
    [],
  );

  useEffect(() => {
    const clientInit = init({
      apiKey: sdkKey,
      assignmentLogger,
      banditLogger,
    });
    const precomputedConfig: IPrecomputedClientConfig = {
      apiKey: sdkKey,
      assignmentLogger,
      banditLogger,
      precompute: { subjectKey, subjectAttributes, banditActions },
    };
    const initPrecomputedClient = precomputedInit(precomputedConfig);

    Promise.all([clientInit, initPrecomputedClient]).then(() => {
      console.log('precomputed client initialized successfully.');

      setIsInitialized(true);
    });
  }, []);

  if (!waitForInitialization || isInitialized) {
    return children;
  }
  return loadingComponent;
}
