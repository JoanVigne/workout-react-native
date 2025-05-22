import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EtirementExercise({ exercise, onUpdateExercise }) {
  // État local pour les séries, initialisé avec les données de l'exercice si elles existent
  const [sets, setSets] = useState(
    exercise.sets?.length > 0 
      ? exercise.sets 
      : [{ weight: '', temps: '', time: '' }]
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
    setSets([...sets, { weight: '', temps: '', time: '' }]);
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
    
    // Mettre à jour l'exercice dans le parent si nécessaire
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

  // Fonction pour incrémenter une valeur
  const incrementValue = (setIndex, field) => {
    const currentValue = sets[setIndex][field] || '0';
    const newValue = (parseInt(currentValue) + 1).toString();
    handleInputChange(setIndex, field, newValue);
  };

  // Fonction pour convertir le temps en secondes
  const convertTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr);
  };

  // Fonction pour démarrer le timer
  const startTimer = (setIndex) => {
    const timeValue = sets[setIndex].time;
    if (timeValue) {
      const seconds = convertTimeToSeconds(timeValue);
      // Ici vous pouvez implémenter la logique du timer
      console.log(`Starting timer for ${seconds} seconds`);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        {/* En-tête du tableau */}
        <View style={styles.tableRow}>
          <View style={[styles.serieCell, styles.serieContainer]}>
            <TouchableOpacity
              style={styles.setButton}
              onPress={removeSet}
            >
              <Ionicons name="remove-circle" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.tableHeader, styles.inputCell]}>Poids</Text>
          <Text style={[styles.tableHeader, styles.inputCell]}>Temps</Text>
          <Text style={[styles.tableHeader, styles.inputCell, styles.lastCell]}>Repos</Text>
        </View>

        {/* Lignes du tableau */}
        {sets.map((set, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={[styles.serieCell]}>
              <Text style={styles.setText}>{index + 1}</Text>
            </View>

            {/* Input Poids */}
            <View style={styles.inputCell}>
              <View style={styles.weightContainer}>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyPreviousValue(index, 'weight')}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(index, 'weight')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(value) => handleInputChange(index, 'weight', value)}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.incrementButton}
                  onPress={() => incrementValue(index, 'weight')}
                >
                  <Text style={styles.copyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Input Temps */}
            <View style={styles.inputCell}>
              <View style={styles.weightContainer}>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyPreviousValue(index, 'temps')}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(index, 'temps')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="numeric"
                  value={set.temps}
                  onChangeText={(value) => handleInputChange(index, 'temps', value)}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.incrementButton}
                  onPress={() => incrementValue(index, 'temps')}
                >
                  <Text style={styles.copyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Input Time */}
            <View style={[styles.inputCell, styles.lastCell]}>
              <View style={styles.timeInputContainer}>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyPreviousValue(index, 'time')}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(index, 'time')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="decimal-pad"
                  value={set.time}
                  onChangeText={(value) => handleInputChange(index, 'time', value)}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                  spellCheck={false}
                  dataDetectorTypes="none"
                />
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => startTimer(index)}
                >
                  <Ionicons name="play-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        {/* Bouton d'ajout de série */}
        <TouchableOpacity
          style={styles.setButton}
          onPress={addSet}
        >
          <Ionicons name="add-circle" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 2,
    marginVertical: 1,
  },
  tableContainer: {
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tableHeader: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  serieCell: {
    width: 40,
    alignItems: 'center',
  },
  serieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setText: {
    fontSize: 14,
    color: '#666',
  },
  inputCell: {
    flex: 1,
    marginHorizontal: 4,
  },
  lastCell: {
    marginRight: 0,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 2,
  },
  copyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 3,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  incrementButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playButton: {
    marginLeft: 2,
  },
  setButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});