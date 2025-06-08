import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SeriePlusMinus({ onAddSet, onRemoveSet }) {
  return (
    <View style={styles.setButtonsContainer}>
      <TouchableOpacity
        style={styles.setButton}
        onPress={onRemoveSet}
      >
        <Ionicons name="remove-circle" size={24} color="#FF6B6B" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.setButton, styles.addButton]}
        onPress={onAddSet}
      >
        <Ionicons name="add-circle" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  setButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 1,
    gap: 20,
  },
  setButton: {
    padding: 2,
  },
});
