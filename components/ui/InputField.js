// components/InputField.js
import React from "react";
import { TextInput, StyleSheet } from "react-native";

export default function InputField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  backgroundColor = "white", // valeur par défaut
}) {
  return (
    <TextInput
      style={[styles.input, { backgroundColor }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
