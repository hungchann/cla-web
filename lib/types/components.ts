import { TextInputProps, ViewStyle } from "react-native";

export interface BaseComponentProps {
  testID?: string;
}

export interface InputProps extends TextInputProps, BaseComponentProps {
  error?: string;
  label?: string;
}

export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  style?: ViewStyle;
}
