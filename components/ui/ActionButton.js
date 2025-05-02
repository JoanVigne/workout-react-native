// components/ui/ActionButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const VARIANT_STYLES = {
  primary: {
    backgroundColor: "#2563EB", // blue-600
    textColor: "#FFFFFF",
    borderColor: "#1D4ED8", // blue-700
  },
  danger: {
    backgroundColor: "#DC2626", // red-600
    textColor: "#FFFFFF",
    borderColor: "#B91C1C", // red-700
  },
  secondary: {
    backgroundColor: "#6B7280", // gray-500
    textColor: "#FFFFFF",
    borderColor: "#4B5563", // gray-600
  },
  success: {
    backgroundColor: "#16A34A", // green-600
    textColor: "#FFFFFF",
    borderColor: "#15803D", // green-700
  },
  warning: {
    backgroundColor: "#F59E0B", // amber-500
    textColor: "#1F2937", // gray-800
    borderColor: "#D97706", // amber-600
  },
  info: {
    backgroundColor: "#0EA5E9", // sky-500
    textColor: "#FFFFFF",
    borderColor: "#0284C7", // sky-600
  },
  light: {
    backgroundColor: "#F3F4F6", // gray-100
    textColor: "#111827", // gray-900
    borderColor: "#D1D5DB", // gray-300
  },
  dark: {
    backgroundColor: "#1F2937", // gray-800
    textColor: "#F9FAFB", // gray-50
    borderColor: "#111827", // gray-900
  },
};

const ActionButton = ({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
}) => {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: variantStyle.backgroundColor },
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: variantStyle.textColor }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default ActionButton;
