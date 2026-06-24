import { TextStyle, ViewStyle } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

export interface Colors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card?: string;
    modal?: string;
    transparent?: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  // Brand colors
  primary: string;
  secondary: string;
  accent: string;
  // Custom colors
  fac738_20?: string;
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  statusSurface: {
    successSubtle: string;
    successEmphasis: string;
    warningSubtle: string;
    warningEmphasis: string;
    errorSubtle: string;
    errorEmphasis: string;
    infoSubtle: string;
    infoEmphasis: string;
  };
  state: {
    primarySubtle: string;
    primaryBorder: string;
    inverseSubtle: string;
    borderMuted: string;
    overlaySoft: string;
    overlayStrong: string;
  };
  // Border colors
  border: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  // Shadow colors
  shadow: string;
  overlay: string;
  chineseRed: string;
}

export type FontWeight = TextStyle["fontWeight"];

export interface TypographyStyle {
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight?: number;
  color?: string;
}

export interface Components {
  button?: {
    primary: ViewStyle;
    secondary: ViewStyle;
    google: ViewStyle;
  };
  input?: {
    default: ViewStyle;
    password: ViewStyle;
  };
}

export interface Layout {
  padding: number;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  shadow: {
    sm: any;
    md: any;
    lg: any;
  };
}

export interface Fonts {
  regular: string;
  medium: string;
  bold: string;
  semiBold: string;
  sizes: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}

export interface Theme {
  colors: Colors;
  typography: Record<string, TypographyStyle>;
  spacing: Record<string, number>;
  layout: Layout;
  fonts: Fonts;
  zIndex: Record<string, number>;
  components?: Components;
}
