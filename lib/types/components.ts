import React from "react";

export interface BaseComponentProps {
  testID?: string;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseComponentProps {
  error?: string;
  label?: string;
}

export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  style?: React.CSSProperties;
}
