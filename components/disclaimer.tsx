/**
 * Disclaimer Component
 * 
 * Reusable disclaimer component for compliance and legal requirements.
 * Non-judgmental, store-compliant copy that clearly states:
 * - This is a support tool, not medical care
 * - Not therapy/treatment
 * - In crisis call local emergency number
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DisclaimerProps {
  variant?: 'compact' | 'full';
  showTitle?: boolean;
}

export function Disclaimer({ variant = 'full', showTitle = true }: DisclaimerProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.compactText, { color: colors.textSecondary }]}>
          {t.disclaimerSupportTool}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {showTitle && (
        <>
          <Text style={[styles.title, { color: colors.text }]}>{t.disclaimerTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.disclaimerSubtitle}
          </Text>
        </>
      )}

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            {t.disclaimerSupportTool}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            {t.disclaimerNotMedical}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            {t.disclaimerNotTherapy}
          </Text>
        </View>

        <View style={[styles.section, styles.crisisSection]}>
          <Text style={[styles.crisisLabel, { color: colors.warning || '#D06B5C' }]}>
            {t.disclaimerCrisisInfo}
          </Text>
          <Text style={[styles.crisisText, { color: colors.text }]}>
            {t.disclaimerCrisisAction}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  crisisSection: {
    flexDirection: 'column',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  crisisLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  crisisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  compactContainer: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  compactText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
