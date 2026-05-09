import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS, TABS, COLORS } from '../utils/constants';
import { useSocketStore } from '../store/socket.store';

// Dashboard
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
// Products
import { ProductListScreen } from '../screens/products/ProductListScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import { AddProductScreen } from '../screens/products/AddProductScreen';
import { EditProductScreen } from '../screens/products/EditProductScreen';
// Orders
import { OrderListScreen } from '../screens/orders/OrderListScreen';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
// Chat
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatConversationScreen } from '../screens/chat/ChatConversationScreen';
// More
import { MoreScreen } from '../screens/more/MoreScreen';
import { EarningsScreen } from '../screens/earnings/EarningsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { StoreSettingsScreen } from '../screens/settings/StoreSettingsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

// ─── Stack Navigators ────────────────────────────────────────────────────────
const DashboardStack = createNativeStackNavigator();
function DashboardStackNav() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name={SCREENS.DASHBOARD} component={DashboardScreen} />
      <DashboardStack.Screen name={SCREENS.NOTIFICATIONS} component={NotificationsScreen} />
    </DashboardStack.Navigator>
  );
}

const ProductsStack = createNativeStackNavigator();
function ProductsStackNav() {
  return (
    <ProductsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ProductsStack.Screen name={SCREENS.PRODUCT_LIST} component={ProductListScreen} />
      <ProductsStack.Screen name={SCREENS.PRODUCT_DETAILS} component={ProductDetailsScreen} />
      <ProductsStack.Screen name={SCREENS.ADD_PRODUCT} component={AddProductScreen} />
      <ProductsStack.Screen name={SCREENS.EDIT_PRODUCT} component={EditProductScreen} />
    </ProductsStack.Navigator>
  );
}

const OrdersStack = createNativeStackNavigator();
function OrdersStackNav() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <OrdersStack.Screen name={SCREENS.ORDER_LIST} component={OrderListScreen} />
      <OrdersStack.Screen name={SCREENS.ORDER_DETAILS} component={OrderDetailsScreen} />
    </OrdersStack.Navigator>
  );
}

const ChatStack = createNativeStackNavigator();
function ChatStackNav() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ChatStack.Screen name={SCREENS.CHAT_LIST} component={ChatListScreen} />
      <ChatStack.Screen name={SCREENS.CHAT_CONVERSATION} component={ChatConversationScreen} />
    </ChatStack.Navigator>
  );
}

const MoreStack = createNativeStackNavigator();
function MoreStackNav() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <MoreStack.Screen name={SCREENS.MORE} component={MoreScreen} />
      <MoreStack.Screen name={SCREENS.EARNINGS} component={EarningsScreen} />
      <MoreStack.Screen name={SCREENS.PROFILE} component={ProfileScreen} />
      <MoreStack.Screen name={SCREENS.EDIT_PROFILE} component={EditProfileScreen} />
      <MoreStack.Screen name={SCREENS.CHANGE_PASSWORD} component={ChangePasswordScreen} />
      <MoreStack.Screen name={SCREENS.STORE_SETTINGS} component={StoreSettingsScreen} />
      <MoreStack.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
    </MoreStack.Navigator>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  // Selector subscribes to only the unread count, not the entire socket store —
  // typing-indicator updates won't re-render the tab bar.
  const totalUnreadMessages = useSocketStore((s) => s.totalUnreadMessages);

  const tabs = [
    { name: TABS.DASHBOARD, icon: 'grid-outline', activeIcon: 'grid' },
    { name: TABS.PRODUCTS, icon: 'bag-outline', activeIcon: 'bag' },
    { name: TABS.ORDERS, icon: 'receipt-outline', activeIcon: 'receipt' },
    { name: TABS.CHAT, icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
    { name: TABS.MORE, icon: 'menu-outline', activeIcon: 'menu' },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: 12,
      paddingHorizontal: 8,
    }}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];
        const showBadge = tab.name === TABS.CHAT && totalUnreadMessages > 0;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={(isFocused ? tab.activeIcon : tab.icon) as any}
                size={24}
                color={isFocused ? COLORS.primary : '#CBD5E1'}
              />
              {showBadge && (
                <View style={{
                  position: 'absolute', top: -3, right: -3,
                  backgroundColor: COLORS.danger, borderRadius: 8,
                  minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{
              fontSize: 10, fontWeight: '700',
              color: isFocused ? COLORS.primary : '#CBD5E1',
              letterSpacing: 0.5,
            }}>
              {tab.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name={TABS.DASHBOARD} component={DashboardStackNav} />
      <Tab.Screen name={TABS.PRODUCTS} component={ProductsStackNav} />
      <Tab.Screen name={TABS.ORDERS} component={OrdersStackNav} />
      <Tab.Screen name={TABS.CHAT} component={ChatStackNav} />
      <Tab.Screen name={TABS.MORE} component={MoreStackNav} />
    </Tab.Navigator>
  );
}
