import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const exerciseTypeMap = {
  muscu: { icon: '💪', label: 'Muscu' },
  cardio: { icon: '🏃', label: 'Cardio' },
  hiit: { icon: '⚡', label: 'HIIT' },
  etirement: { icon: '🧘', label: 'Étirement' },
  poids: { icon: '⚖️', label: 'Poids libre' }
};

export default function ExerciseType({ type }) {
  const exerciseInfo = exerciseTypeMap[type] || { icon: '❓', label: 'Autre' };

  return (
    <View style={styles.exerciseType}>
      <Text style={styles.typeText}>
        {exerciseInfo.icon} {exerciseInfo.label}
      </Text>
    </View>
  );
}

ExerciseType.propTypes = {
  type: PropTypes.oneOf(['muscu', 'cardio', 'hiit', 'etirement', 'poids']).isRequired,
};

const styles = StyleSheet.create({
  exerciseType: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#666',
  },
});
