import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SeriePlusMinus from '../ui/SeriePlusMinus';

export default function HiitExercise({ exercise, onUpdateExercise }) {
  // État pour les rounds
  const [rounds, setRounds] = useState(
    exercise.rounds?.length > 0
      ? exercise.rounds
      : [{
          workTime: '45',  // Temps de travail en secondes
          restTime: '15',  // Temps de repos en secondes
          exercises: [''],  // Liste des exercices pour ce round
          intensity: ''     // Intensité prévue (ex: RPE, % FC max)
        }]
  );

  // Référence pour le timer
  const timerRef = useRef(null);

  // Obtenir le placeholder basé sur la dernière performance
  const getPlaceholder = (roundIndex, field) => {
    if (!exercise.lastPerformance?.rounds || !exercise.lastPerformance.rounds[roundIndex]) return '';
    return exercise.lastPerformance.rounds[roundIndex][field] || '';
  };

  // Ajouter un exercice à un round spécifique
  const addExerciseToRound = (roundIndex) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].exercises.push('');
    setRounds(newRounds);
    updateExercise(newRounds);
  };

  // Supprimer un exercice d'un round spécifique
  const removeExerciseFromRound = (roundIndex, exerciseIndex) => {
    if (rounds[roundIndex].exercises.length > 1) {
      const newRounds = [...rounds];
      newRounds[roundIndex].exercises.splice(exerciseIndex, 1);
      setRounds(newRounds);
      updateExercise(newRounds);
    }
  };

  // Mettre à jour un exercice dans un round
  const updateExerciseInRound = (roundIndex, exerciseIndex, value) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].exercises[exerciseIndex] = value;
    setRounds(newRounds);
    updateExercise(newRounds);
  };

  // Ajouter un nouveau round
  const addRound = () => {
    // Récupérer les exercices du dernier round
    const lastRound = rounds[rounds.length - 1];
    const newRound = {
      workTime: '45',
      restTime: '15',
      exercises: [...lastRound.exercises], // Copier tous les exercices du dernier round
      intensity: ''
    };
    
    setRounds([...rounds, newRound]);
    updateExercise([...rounds, newRound]);
  };

  // Supprimer un round
  const removeRound = () => {
    if (rounds.length > 1) {
      const newRounds = rounds.slice(0, -1);
      setRounds(newRounds);
      updateExercise(newRounds);
    }
  };

  // Mettre à jour les temps ou l'intensité d'un round
  const updateRoundField = (index, field, value) => {
    const newRounds = [...rounds];
    newRounds[index][field] = value;
    setRounds(newRounds);
    updateExercise(newRounds);
  };

  // Mettre à jour l'exercice principal
  const updateExercise = (newRounds) => {
    onUpdateExercise({
      ...exercise,
      rounds: newRounds
    });
  };

  return (
    <ScrollView style={styles.container}>
      {rounds.map((round, roundIndex) => (
        <View key={roundIndex} style={styles.roundContainer}>
          <Text style={styles.roundTitle}>Round {roundIndex + 1}</Text>
          
          <View style={styles.timingContainer}>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Travail (sec)</Text>
              <TextInput
                style={styles.input}
                value={round.workTime}
                onChangeText={(value) => updateRoundField(roundIndex, 'workTime', value)}
                keyboardType="numeric"
                placeholder={getPlaceholder(roundIndex, 'workTime')}
              />
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.label}>Repos (sec)</Text>
              <TextInput
                style={styles.input}
                value={round.restTime}
                onChangeText={(value) => updateRoundField(roundIndex, 'restTime', value)}
                keyboardType="numeric"
                placeholder={getPlaceholder(roundIndex, 'restTime')}
              />
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.label}>Intensité</Text>
              <TextInput
                style={styles.input}
                value={round.intensity}
                onChangeText={(value) => updateRoundField(roundIndex, 'intensity', value)}
                placeholder={getPlaceholder(roundIndex, 'intensity')}
              />
            </View>
          </View>

          {round.exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseContainer}>
              <TextInput
                style={styles.exerciseInput}
                value={exercise}
                onChangeText={(value) => updateExerciseInRound(roundIndex, exerciseIndex, value)}
                placeholder={`Exercice ${exerciseIndex + 1}`}
              />
              {round.exercises.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeExerciseFromRound(roundIndex, exerciseIndex)}
                  style={styles.removeButton}
                >
                  <Ionicons name="remove-circle-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => addExerciseToRound(roundIndex)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Ajouter un exercice</Text>
          </TouchableOpacity>
        </View>
      ))}

      <SeriePlusMinus onAddSet={addRound} onRemoveSet={removeRound} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 2,
  },
  roundContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 4,
    marginBottom: 4,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 2,
  },
  label: {
    fontSize: 12,
    marginBottom: 1,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  exerciseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  exerciseInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  roundButton: {
    backgroundColor: '#2196F3',
    padding: 4,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  removeRoundButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  removeButtonText: {
    color: 'white',
  },
});
