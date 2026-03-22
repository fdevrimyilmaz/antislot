/**
 * Storage Notice Component
 * 
 * Non-blocking banner that appears when storage falls back to memory.
 * Shows calm, informative message with link to Diagnostics.
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { isUsingStorageFallback } from '@/lib/storage';
import { router } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StorageNoticeProps {
  onDismiss?: () => void;
}

export function StorageNotice({ onDismiss }: StorageNoticeProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const usingFallback = isUsingStorageFallback();

  if (!usingFallback) {
    return null;
  }

  const handleViewDetails = () => {
    router.push('/diagnostics');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.warning || '#FFE5B4', borderColor: colors.border }]}>
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.text }]}>
          {t.storageNoticeMessage || 'Veri depolama geçici olarak sınırlı. Uygulama normal çalışmaya devam ediyor.'}
        </Text>
        <TouchableOpacity
          onPress={handleViewDetails}
          style={styles.linkButton}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            {t.storageNoticeLink || 'Detaylar'}
          </Text>
        </TouchableOpacity>
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
        >
          <Text style={[styles.dismissText, { color: colors.text }]}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 60, // Account for status bar
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginRight: 8,
    flex: 1,
  },
  linkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 20,
  },
});
