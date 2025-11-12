import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </PaperProvider>
    </ReduxProvider>
  );
}
