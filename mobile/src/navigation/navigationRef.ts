import { createNavigationContainerRef } from '@react-navigation/native';

// A global ref to the navigation tree, used by BottomTabBar so it can read
// the active route and navigate without needing to sit inside any specific
// navigator's own React context (it's rendered as a persistent sibling next
// to the Stack.Navigator, not one of its screens).
export const navigationRef = createNavigationContainerRef<any>();
