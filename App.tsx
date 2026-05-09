import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/layout/ErrorBoundary';
import { initSentry } from './src/services/sentry';
import {
  queryClient,
  attachAppStateFocus,
  attachNetInfoOnline,
  detachAll,
} from './src/services/queryClient';
import { queryPersister, dehydrateOptions, PERSIST_BUSTER } from './src/services/queryPersister';

// No-op when EXPO_PUBLIC_SENTRY_DSN is unset — safe at any startup phase.
initSentry();

export default function App() {
  useEffect(() => {
    attachAppStateFocus();
    attachNetInfoOnline();
    return () => detachAll();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister,
              maxAge: 1000 * 60 * 60 * 24, // 24h
              buster: PERSIST_BUSTER,
              // Loose type — the persister's vendored query-core has a
              // different nominal Query symbol but the runtime shape matches.
              dehydrateOptions: dehydrateOptions as unknown as object,
            }}
          >
            <StatusBar style="auto" />
            <RootNavigator />
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
