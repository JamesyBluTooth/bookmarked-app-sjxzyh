
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Dashboard',
    },
    {
      name: 'books',
      route: '/(tabs)/books',
      icon: 'books.fill',
      label: 'Books',
    },
    {
      name: 'friends',
      route: '/(tabs)/friends',
      icon: 'person.2.fill',
      label: 'Friends',
    },
    {
      name: 'groups',
      route: '/(tabs)/groups',
      icon: 'message',
      label: 'Groups',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      label: 'Profile',
    },
  ];

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <Icon sf="house.fill" drawable="ic_home" />
          <Label>Dashboard</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="books">
          <Icon sf="book.fill" drawable="ic_book" />
          <Label>Books</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="friends">
          <Icon sf="person.2.fill" drawable="ic_friends" />
          <Label>Friends</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="groups">
          <Icon sf="person.3.fill" drawable="ic_groups" />
          <Label>Groups</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" drawable="ic_profile" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="books" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="groups" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={360} />
    </>
  );
}
