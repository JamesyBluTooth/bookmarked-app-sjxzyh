
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  light: {
    background: '#F9F9F9',
    text: '#212121',
    textSecondary: '#757575',
    primary: '#6200EE',
    secondary: '#03DAC5',
    accent: '#BB86FC',
    card: '#FFFFFF',
    highlight: '#FFD740',
    border: '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    primary: '#BB86FC',
    secondary: '#03DAC5',
    accent: '#6200EE',
    card: '#1E1E1E',
    highlight: '#FFD740',
    border: '#2C2C2C',
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFA726',
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
