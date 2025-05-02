import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';

export default function PerformanceTable({ perf, exercises }) {
  if (!perf || Object.keys(perf).length === 0) return null;

  // Sort dates in descending order
  const dates = Object.keys(perf).sort((a, b) => new Date(b) - new Date(a));

  // Create a map of exercise IDs to names
  const exerciseNames = {};
  exercises?.forEach(exercise => {
    exerciseNames[exercise.id] = exercise.name;
  });

  const renderExerciseData = (date, exerciseId, exerciseData) => {
    if (exerciseId === 'noteExo') return null;

    const sets = [];
    let maxSetIndex = 0;

    // Find the highest set number
    Object.keys(exerciseData).forEach(key => {
      if (key.startsWith('weight') || key.startsWith('reps')) {
        const setNum = parseInt(key.slice(-1));
        maxSetIndex = Math.max(maxSetIndex, setNum);
      }
    });

    // Compile sets data
    for (let i = 0; i <= maxSetIndex; i++) {
      const weight = exerciseData[`weight${i}`] || 'ɵ';
      const reps = exerciseData[`reps${i}`] || 'ɵ';
      const interval = exerciseData[`interval${i}`] || 'ɵ';
      
      sets.push(
        <View key={i} style={styles.setRow}>
          <Text style={styles.setText}>
            {weight === 'ɵ' ? 'ɵ' : `${weight}kg`} × {reps}
          </Text>
          {interval !== 'ɵ' && (
            <Text style={styles.intervalText}>{interval}min</Text>
          )}
        </View>
      );
    }

    return (
      <View key={exerciseId} style={styles.exerciseContainer}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>
            {exerciseNames[exerciseId] || exerciseId.replace(/^exoPerso/, '')}
          </Text>
          {exerciseData.noteExo && (
            <Text style={styles.noteText}>Note: {exerciseData.noteExo}</Text>
          )}
        </View>
        <View style={styles.setsContainer}>
          {sets}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.tableContainer}>
        {/* Scroll indicator */}
        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollText}>←  →</Text>
        </View>

        <ScrollView 
          horizontal 
          style={styles.container}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.dateColumnsContainer}>
            {dates.map(date => (
              <View key={date} style={styles.dateColumn}>
                <Text style={styles.dateHeader}>
                  {new Date(date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
                <View style={styles.exercisesContainer}>
                  {Object.entries(perf[date])
                    .filter(([key]) => key !== 'noteExo')
                    .sort(([, a], [, b]) => 
                      (parseInt(a.exoOrder) || 0) - (parseInt(b.exoOrder) || 0)
                    )
                    .map(([exerciseId, exerciseData]) => 
                      renderExerciseData(date, exerciseId, exerciseData)
                    )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginHorizontal: 1,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  scrollText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 8,
  },
  dateColumnsContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  dateColumn: {
    width: 200,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  exercisesContainer: {
    gap: 16,
  },
  exerciseContainer: {
    gap: 8,
  },
  exerciseHeader: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
    marginLeft: 8,
  },
  setsContainer: {
    gap: 4,
    paddingLeft: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setText: {
    fontSize: 14,
    color: '#666',
  },
  intervalText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2196F3',
    textAlign: 'center',
  },
  leftShadow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rightShadow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
