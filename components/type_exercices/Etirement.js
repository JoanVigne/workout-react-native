import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SeriePlusMinus from '../ui/SeriePlusMinus';

export default function Etirement({ exercise, onUpdateExercise, timerRef }) {
  const [sets, setSets] = useState(
    exercise.sets?.length > 0 
      ? exercise.sets 
      : [{ poids: '', reps: '', time: '' }]
  );
  
  const internalTimerRef = useRef(null);

  const getPlaceholder = (index, field) => {
    if (!exercise.lastPerformance?.sets || !exercise.lastPerformance.sets[index]) return '';
    return exercise.lastPerformance.sets[index][field] || '';
  };

  const addSet = () => {
    setSets([...sets, { poids: '', reps: '', time: '' }]);
  };

  const removeSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  const handleInputChange = (setIndex, field, value) => {
    const newSets = [...sets];
    newSets[setIndex][field] = value;
    setSets(newSets);
    
    if (onUpdateExercise) {
      onUpdateExercise({
        ...exercise,
        sets: newSets
      });
    }
  };

  const copyPreviousValue = (setIndex, field) => {
    if (setIndex > 0) {
      const previousValue = sets[setIndex - 1][field];
      handleInputChange(setIndex, field, previousValue);
    }
  };

  const incrementValue = (setIndex, field) => {
    const currentValue = sets[setIndex][field] || '0';
    const newValue = (parseInt(currentValue) + 1).toString();
    handleInputChange(setIndex, field, newValue);
  };

  const convertTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    
    // Si le format est mm:ss
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    // Si c'est un nombre entier ou décimal
    const time = parseFloat(timeStr.replace(',', '.'));
    if (isNaN(time)) return 0;
    
    // Si c'est un nombre entier (comme "1"), c'est des minutes
    if (Number.isInteger(time)) {
      return time * 60;
    }
    
    // Si c'est un nombre décimal (comme "1.30"), c'est minutes.secondes
    const minutes = Math.floor(time);
    const seconds = Math.round((time - minutes) * 100);  // 0.3 -> 30 secondes
    
    return (minutes * 60) + seconds;
  };

  const startTimer = (setIndex) => {
    // Récupérer la valeur du temps ou utiliser le placeholder si aucune valeur n'est définie
    let timeValue = sets[setIndex].time;
    
    // Si aucune valeur n'est définie, utiliser le placeholder
    if (!timeValue) {
      timeValue = getPlaceholder(setIndex, 'time');
      
      // Si un placeholder existe, mettre à jour la valeur dans les sets
      if (timeValue) {
        const newSets = [...sets];
        newSets[setIndex].time = timeValue;
        setSets(newSets);
        
        if (onUpdateExercise) {
          onUpdateExercise({ ...exercise, sets: newSets });
        }
      }
    }
    
    if (timeValue) {
      const seconds = convertTimeToSeconds(timeValue);
      console.log(`Starting timer for ${seconds} seconds`);
      
      // Arrêter le timer précédent s'il existe
      if (internalTimerRef.current) {
        clearTimeout(internalTimerRef.current);
        internalTimerRef.current = null;
      }
      
      // Démarrer le timer du StartWorkoutScreen si la référence est disponible
      if (timerRef && timerRef.current && timerRef.current.startTimer) {
        timerRef.current.startTimer(seconds);
      } else {
        console.log('Timer reference not available');
      }
      
      // Exemple d'affichage d'une alerte après le temps écoulé
      internalTimerRef.current = setTimeout(() => {
        console.log(`Timer finished for set ${setIndex + 1}!`);
      }, seconds * 1000);
    } else {
      console.log('Aucune valeur de temps définie pour démarrer le timer');
    }
  };
  
  const stopTimer = () => {
    if (timerRef && timerRef.current && timerRef.current.stopTimer) {
      timerRef.current.stopTimer();
    }
    if (internalTimerRef.current) {
      clearTimeout(internalTimerRef.current);
      internalTimerRef.current = null;
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        {/* En-tête du tableau */}
        <View style={styles.tableRow}>
          <View style={[styles.serieCell, styles.serieContainer]}>
            <Text style={styles.setText}>Série</Text>
          </View>
          <Text style={[styles.tableHeader, styles.inputCell]}>Poids</Text>
          <Text style={[styles.tableHeader, styles.inputCell]}>Reps</Text>
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
                  onPress={() => copyPreviousValue(index, 'poids')}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(index, 'poids')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="numeric"
                  value={set.poids}
                  onChangeText={(value) => handleInputChange(index, 'poids', value)}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.incrementButton}
                  onPress={() => incrementValue(index, 'poids')}
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
                  onPress={() => copyPreviousValue(index, 'reps')}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(index, 'reps')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(value) => handleInputChange(index, 'reps', value)}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.incrementButton}
                  onPress={() => incrementValue(index, 'reps')}
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
        
        <SeriePlusMinus onAddSet={addSet} onRemoveSet={removeSet} />
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
    marginLeft: 1,
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