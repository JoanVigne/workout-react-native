import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function CloseButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.closeButton}>
      <Text style={styles.closeText}>✖</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
    zIndex: 1,
  },
  closeText: {
    fontSize: 22,
    color: "#888",
  },
});
