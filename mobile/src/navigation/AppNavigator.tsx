import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootStack } from './RootStack';
import { AppDrawerContent } from './AppDrawerContent';

const Drawer = createDrawerNavigator();

export const AppNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: '85%', maxWidth: 360 },
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
      drawerContent={(props) => <AppDrawerContent {...props} />}
    >
      <Drawer.Screen name="Root" component={RootStack} />
    </Drawer.Navigator>
  );
};
