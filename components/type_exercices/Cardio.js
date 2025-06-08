import React, { useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SeriePlusMinus from '../ui/SeriePlusMinus';

export default function Cardio({ exercise, onUpdateExercise, timerRef }) {
  const [sets, setSets] = useState(
    exercise.sets?.length > 0 
      ? exercise.sets 
      : [{ 
          vitesse: '', 
          resistance: '', 
          temps: '', 
          distance: '', 
          elevation: '',
          time: ''
        }]
  );
  
  const internalTimerRef = useRef(null);

  const getPlaceholder = (index, field) => {
    if (!exercise.lastPerformance?.sets || !exercise.lastPerformance.sets[index]) return '';
    return exercise.lastPerformance.sets[index][field] || '';
  };


  const addSet = () => {
    setSets([...sets, { 
      vitesse: '', 
      resistance: '', 
      temps: '', 
      distance: '', 
      time: '',
      elevation: ''
    }]);
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
      onUpdateExercise({ ...exercise, sets: newSets });
    }
  };

  const copyPreviousValue = (setIndex, field) => {
    if (setIndex > 0) {
      const newSets = [...sets];
      newSets[setIndex][field] = sets[setIndex - 1][field];
      setSets(newSets);
      if (onUpdateExercise) {
        onUpdateExercise({ ...exercise, sets: newSets });
      }
    }
  };

  const incrementValue = (setIndex, field) => {
    const newSets = [...sets];
    const currentValue = parseFloat(newSets[setIndex][field]) || 0;
    newSets[setIndex][field] = (currentValue + 1).toString();
    setSets(newSets);
    if (onUpdateExercise) {
      onUpdateExercise({ ...exercise, sets: newSets });
    }
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
        clearInterval(internalTimerRef.current);
      }
      
      // Démarrer le timer du StartWorkoutScreen si la référence est disponible
      if (timerRef && timerRef.current) {
        timerRef.current.startTimer(seconds);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
          <View style={[styles.headerGroup]}>
            <View style={styles.inputCell}>
              <Text style={[styles.tableHeader, styles.vitesseHeader]}>Vitesse /</Text>
            </View>
            <View style={styles.inputCell}>
              <Text style={[styles.tableHeader, styles.resistanceHeader]}>Résistance /</Text>
            </View>
            <View style={styles.inputCell}>
              <Text style={[styles.tableHeader, styles.deniveleHeader]}>Dénivelé /</Text>
            </View>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.serieCell, styles.serieContainer]}>
            <Text style={styles.setText}></Text>
          </View>
          <View style={[styles.headerGroup, styles.lastCell]}>
            <View style={styles.inputCell}>
              <Text style={[styles.tableHeader, styles.tempsHeader]}>Temps</Text>
            </View>
            <View style={styles.inputCell}>
              <Text style={[styles.tableHeader, styles.distanceHeader]}>Distance</Text>
            </View>
            <View style={styles.inputCell}>
              <Text style={[styles.tableHeader, styles.reposHeader]}>Repos</Text>
            </View>
          </View>
          
        </View>
        <View style={styles.seriesSeparator} />
        {/* Lignes du tableau */}
        {sets.map((set, index) => (
          <View key={index}>
            {index > 0 && <View style={styles.seriesSeparator} />}
            <View style={[styles.tableRow, styles.seriesRow]}>
              <View style={[styles.serieCell, styles.serieAlignTop]}>
                <Text style={styles.setText}>{index + 1}</Text>
              </View>
              
              <View style={styles.serieInputContainer}>
              {/* First row of inputs */}
              <View style={styles.inputGroup}>
                <View style={styles.inputCell}>
                  <View style={styles.weightContainer}>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyPreviousValue(index, 'vitesse')}
                    >
                      <Text style={styles.copyButtonText}>=</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.vitesseInput]}
                      placeholder={getPlaceholder(index, 'vitesse')}
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      keyboardType="numeric"
                      value={set.vitesse}
                      onChangeText={(value) => handleInputChange(index, 'vitesse', value)}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity 
                      style={styles.invisibleButton}
                    >
                      <Text style={styles.invisibleButtonText}>+</Text>
                    </TouchableOpacity>

                  </View>
                </View>
                <View style={styles.inputCell}>
                  <View style={styles.weightContainer}>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyPreviousValue(index, 'resistance')}
                    >
                      <Text style={styles.copyButtonText}>=</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.resistanceInput]}
                      placeholder={getPlaceholder(index, 'resistance')}
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      keyboardType="numeric"
                      value={set.resistance}
                      onChangeText={(value) => handleInputChange(index, 'resistance', value)}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity 
                      style={styles.invisibleButton}
                    >
                      <Text style={styles.invisibleButtonText}>+</Text>
                    </TouchableOpacity>

                  </View>
                </View>
                <View style={styles.inputCell}>
                  <View style={styles.weightContainer}>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyPreviousValue(index, 'elevation')}
                    >
                      <Text style={styles.copyButtonText}>=</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.deniveleInput]}
                      placeholder={getPlaceholder(index, 'elevation')}
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      keyboardType="numeric"
                      value={set.elevation}
                      onChangeText={(value) => handleInputChange(index, 'elevation', value)}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity 
                      style={styles.invisibleButton}
                    >
                      <Text style={styles.invisibleButtonText}>+</Text>
                    </TouchableOpacity>

                  </View>
                </View>
              </View>

              {/* Second row of inputs */}
              <View style={[styles.inputGroup, styles.lastCell]}>
                <View style={styles.inputCell}>
                  <View style={styles.weightContainer}>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyPreviousValue(index, 'temps')}
                    >
                      <Text style={styles.copyButtonText}>=</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.tempsInput]}
                      placeholder={getPlaceholder(index, 'temps')}
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      keyboardType="decimal-pad"
                      value={set.temps}
                      onChangeText={(value) => handleInputChange(index, 'temps', value)}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                      spellCheck={false}
                      dataDetectorTypes="none"
                    />
                    <TouchableOpacity 
                      style={styles.invisibleButton}
                    >
                      <Text style={styles.invisibleButtonText}>+</Text>
                    </TouchableOpacity>

                  </View>
                </View>
                <View style={styles.inputCell}>
                  <View style={styles.weightContainer}>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyPreviousValue(index, 'distance')}
                    >
                      <Text style={styles.copyButtonText}>=</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.distanceInput]}
                      placeholder={getPlaceholder(index, 'distance')}
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      keyboardType="numeric"
                      value={set.distance}
                      onChangeText={(value) => handleInputChange(index, 'distance', value)}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity 
                      style={styles.invisibleButton}
                    >
                      <Text style={styles.invisibleButtonText}>+</Text>
                    </TouchableOpacity>

                  </View>
                </View>
                <View style={styles.inputCell}>
                  <View style={styles.weightContainer}>
                    <TouchableOpacity 
                      style={styles.invisibleButton}
                    >
                      <Text style={styles.invisibleButtonText}>=</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.reposInput]}
                      placeholder={getPlaceholder(index, 'time')}
                      placeholderTextColor="rgba(0, 0, 0, 0.3)"
                      keyboardType="numeric"
                      value={set.time}
                      onChangeText={(value) => handleInputChange(index, 'time', value)}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
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
  seriesRow: {
    gap: 4,
  },
  headerGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  tableHeader: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  vitesseHeader: {
    color: '#2196F3',
  },
  resistanceHeader: {
    color: '#4CAF50',
  },
  reposHeader: {
    color: '#4CAF50',
  },
  tempsHeader: {
    color: '#4CAF50',
  },
  distanceHeader: {
    color: '#000000',
  },
  deniveleHeader: {
    color: '#000000',
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
    marginBottom: 4,
  },
  serieCell: {
    width: 40,
    alignItems: 'center',
  },
  serieAlignTop: {
    alignSelf: 'flex-start',
    paddingTop: 5,
  },
  seriesSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    marginLeft: 40,
  },
  serieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  inputCell: {
    flex: 1,
    marginHorizontal: 4,
  },
  lastCell: {
    marginRight: 0,
  },
  inputGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    height: 30,
    paddingHorizontal: 4,
    fontSize: 14,
    flex: 1,
    minWidth: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
  },
  vitesseInput: {
    borderColor: '#2196F3',
  },
  resistanceInput: {
    borderColor: '#4CAF50',
  },
  reposInput: {
    borderColor: '#4CAF50',
  },
  tempsInput: {
    borderColor: '#4CAF50',
  },
  distanceInput: {
    borderColor: '#000000',
  },
  deniveleInput: {
    borderColor: '#000000',
  },
  inputContainer: {
    gap: 2,
  },
  serieInputContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
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

  invisibleButton: {
    width: 20,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  invisibleButtonText: {
    fontSize: 16,
    opacity: 0,
  },
  setButton: {
    alignSelf: 'center',
    marginTop: 8,
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
  }
});