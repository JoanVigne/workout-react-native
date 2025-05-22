import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CardioExercise({ exercise, onUpdateExercise }) {
  // État local pour les séries
  const [sets, setSets] = useState(
    exercise.sets?.length > 0 
      ? exercise.sets 
      : [{ vitesse: '', resistance: '', temps: '', distance: '', time: '' }]
  );
  
  // Référence pour le timer
  const timerRef = useRef(null);

  // Fonction pour obtenir la valeur placeholder basée sur lastPerformance
  const getPlaceholder = (index, field) => {
    if (!exercise.lastPerformance?.sets || !exercise.lastPerformance.sets[index]) return '';
    return exercise.lastPerformance.sets[index][field] || '';
  };

  // Fonctions de gestion des séries
  const addSet = () => {
    setSets([...sets, { vitesse: '', resistance: '', temps: '', distance: '', time: '' }]);
  };

  const removeSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  // Fonction pour mettre à jour une valeur dans une série
  const handleInputChange = (setIndex, field, value) => {
    const newSets = [...sets];
    newSets[setIndex][field] = value;
    setSets(newSets);
    
    // Mettre à jour l'exercice dans le parent
    if (onUpdateExercise) {
      onUpdateExercise({
        ...exercise,
        sets: newSets
      });
    }
  };

  // Fonction pour copier la valeur précédente
  const copyPreviousValue = (setIndex, field) => {
    if (setIndex > 0) {
      const previousValue = sets[setIndex - 1][field];
      handleInputChange(setIndex, field, previousValue);
    }
  };

  // Fonction pour démarrer le timer
  const startTimer = (setIndex) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      handleInputChange(setIndex, 'time', timeString);
    }, 1000);
  };

  // Fonction pour arrêter le timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <View style={styles.container}>

      {sets.map((set, index) => (
        <View key={index} style={styles.setContainer}>
          <View style={styles.setHeader}>
            <Text style={styles.setText}>Série {index + 1}</Text>
            {index > 0 && (
              <TouchableOpacity onPress={() => removeSet()} style={styles.removeButton}>
                <Ionicons name="remove-circle-outline" size={24} color="red" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vitesse</Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => copyPreviousValue(index, 'vitesse')}>
                  <Text style={styles.equalButton}>=</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder(index, 'vitesse')}
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                keyboardType="numeric"
                value={set.vitesse}
                onChangeText={(value) => handleInputChange(index, 'vitesse', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Résistance</Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => copyPreviousValue(index, 'resistance')}>
                  <Text style={styles.equalButton}>=</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder(index, 'resistance')}
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                keyboardType="numeric"
                value={set.resistance}
                onChangeText={(value) => handleInputChange(index, 'resistance', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Temps</Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => copyPreviousValue(index, 'temps')}>
                  <Text style={styles.equalButton}>=</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder(index, 'temps')}
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                keyboardType="numeric"
                value={set.temps}
                onChangeText={(value) => handleInputChange(index, 'temps', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Distance</Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => copyPreviousValue(index, 'distance')}>
                  <Text style={styles.equalButton}>=</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder(index, 'distance')}
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                keyboardType="numeric"
                value={set.distance}
                onChangeText={(value) => handleInputChange(index, 'distance', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Repos</Text>
              <View style={styles.timerButtons}>
                <TouchableOpacity onPress={() => startTimer(index)} style={styles.timerButton}>
                  <Ionicons name="play" size={20} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={stopTimer} style={styles.timerButton}>
                  <Ionicons name="stop" size={20} color="red" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder(index, 'time')}
                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                value={set.time}
                editable={false}
              />
            </View>
          </View>
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={addSet} style={styles.roundButton}>
          <Text style={styles.buttonText}>+ Ajouter une série</Text>
        </TouchableOpacity>
        {sets.length > 1 && (
          <TouchableOpacity onPress={removeSet} style={[styles.roundButton, styles.removeRoundButton]}>
            <Text style={[styles.buttonText, styles.removeButtonText]}>- Supprimer la dernière série</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 2,
    backgroundColor: 'white',
    borderRadius: 4,
    margin: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  setContainer: {
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 2,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  setText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  inputContainer: {
    gap: 2,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    width: 80,
    fontSize: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  equalButton: {
    fontSize: 18,
    color: 'blue',
    paddingHorizontal: 8,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    padding: 4,
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