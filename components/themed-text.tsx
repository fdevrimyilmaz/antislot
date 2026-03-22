import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { Colors, Fonts, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  style?: StyleProp<TextStyle>;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...(Typography.body as TextStyle),
    fontFamily: Fonts.body,
  },
  defaultSemiBold: {
    ...(Typography.body as TextStyle),
    fontFamily: Fonts.bodySemiBold,
  },
  title: {
    ...(Typography.display as TextStyle),
    fontFamily: Fonts.display,
  },
  subtitle: {
    ...(Typography.subtitle as TextStyle),
    fontFamily: Fonts.bodySemiBold,
  },
  link: {
    ...(Typography.body as TextStyle),
    fontFamily: Fonts.bodyMedium,
    color: Colors.light.tint,
  },
});
