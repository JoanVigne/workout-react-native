import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  BackHandler,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import TimerDisplay from '../components/TimerDisplay';

export default function StartWorkoutScreen({ route, navigation }) {
  const { workout } = route.params;
  const [exerciseData, setExerciseData] = useState({});
  const [noteHeights, setNoteHeights] = useState({});
  const timerRef = useRef();

  // Check if there are any unsaved changes
  const hasUnsavedChanges = () => {
    console.log('Checking changes:', exerciseData);
    const hasChanges = Object.values(exerciseData).some(exercise => {
      if (!exercise?.sets) return false;
      return Object.values(exercise.sets).some(set => {
        const hasValue = Boolean(set.weight || set.reps || set.time);
        console.log('Set values:', set, 'Has value:', hasValue);
        return hasValue;
      });
    });
    console.log('Has changes:', hasChanges);
    return hasChanges;
  };

  // Handle navigation
  const handleNavigation = () => {
    if (!hasUnsavedChanges()) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Quitter l\'entraînement ?',
      'Si vous quittez maintenant, vous allez perdre votre progression.',
      [
        { 
          text: "Rester",
          style: 'cancel'
        },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            setExerciseData({});
            navigation.dispatch(e => {
              // Remove all events from the queue and just go back
              const popAction = navigation.pop();
              return popAction;
            });
          }
        }
      ]
    );
  };

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleNavigation();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Handle screen exit
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges() || !exerciseData) {
        return;
      }

      e.preventDefault();
      handleNavigation();
    });

    return unsubscribe;
  }, [navigation, exerciseData]);

  // Show confirmation dialog
  const showConfirmDialog = () => {
    return new Promise((resolve) => {
      Alert.alert(
        'Quitter l\'entraînement ?',
        'Si vous quittez maintenant, vous allez perdre votre progression.',
        [
          { text: "Rester", style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: () => resolve(true),
          }
        ]
      );
    });
  };

  // Get last performance for an exercise
  const getLastPerformance = (exerciseId) => {
    if (!workout.perf || Object.keys(workout.perf).length === 0) return '';
    
    // Get dates in descending order
    const dates = Object.keys(workout.perf).sort((a, b) => new Date(b) - new Date(a));
    const lastDate = dates[0];
    const lastPerf = workout.perf[lastDate]?.[exerciseId];
    
    return lastPerf || '';
  };

  // Get number of sets from last performance
  const getLastPerfSetCount = (exerciseId) => {
    const lastPerf = getLastPerformance(exerciseId);
    if (!lastPerf) return 1;

    // Count the number of sets by looking at reps entries
    let setCount = 0;
    while (lastPerf[`reps${setCount}`] !== undefined) {
      setCount++;
    }
    return setCount || 1;
  };

  // Get placeholder text based on last performance
  const getPlaceholder = (exerciseId, setIndex, field) => {
    const lastPerf = getLastPerformance(exerciseId);
    if (!lastPerf) return '';
    
    // The data structure uses field+index format (e.g., weight0, reps0)
    if (field === 'time') {
      return lastPerf[`interval${setIndex}`] || '';
    }
    
    return lastPerf[`${field}${setIndex}`] || '';
  };

  const convertTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    
    // Convert string to number and handle both . and , as decimal separator
    const time = parseFloat(timeStr.replace(',', '.'));
    if (isNaN(time)) return 0;

    // Extract minutes and seconds
    const minutes = Math.floor(time);
    const seconds = Math.round((time - minutes) * 100);  // 0.3 -> 30 seconds

    return (minutes * 60) + seconds;
  };

  const formatSecondsToMinutes = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `0.${(remainingSeconds).toString().padStart(2, '0')}`;
    }
    return remainingSeconds === 0 ? minutes.toString() : `${minutes}.${(remainingSeconds).toString().padStart(2, '0')}`;
  };

  const handleInputChange = (exerciseId, field, value) => {
    const [fieldType, setIndex] = field.split('_');
    setExerciseData(prevData => {
      const currentExerciseData = prevData[exerciseId] || {};
      const currentSets = currentExerciseData.sets || {};
      const currentSet = currentSets[setIndex] || {};

      return {
        ...prevData,
        [exerciseId]: {
          ...currentExerciseData,
          sets: {
            ...currentSets,
            [setIndex]: {
              ...currentSet,
              [fieldType]: value
            }
          }
        }
      };
    });
  };

  const addSet = (exerciseId) => {
    setExerciseData(prev => {
      const exerciseData = prev[exerciseId] || {};
      const currentSets = exerciseData.sets || {};
      const newSetIndex = Object.keys(currentSets).length;
      
      return {
        ...prev,
        [exerciseId]: {
          ...exerciseData,
          sets: {
            ...currentSets,
            [newSetIndex]: { weight: '', reps: '', time: '', isTimerRunning: false }
          }
        }
      };
    });
  };

  const removeSet = (exerciseId) => {
    setExerciseData(prev => {
      const exerciseData = prev[exerciseId] || {};
      const currentSets = { ...exerciseData.sets || {} };
      const lastIndex = Object.keys(currentSets).length - 1;
      
      if (lastIndex >= 0) {
        delete currentSets[lastIndex];
      }
      
      return {
        ...prev,
        [exerciseId]: {
          ...exerciseData,
          sets: currentSets
        }
      };
    });
  };

  // Initialize exercise data with sets from last performance
  useEffect(() => {
    const initialData = {};
    workout.exercices.forEach(exercise => {
      const setCount = getLastPerfSetCount(exercise.id);
      const sets = {};
      for (let i = 0; i < setCount; i++) {
        sets[i] = { weight: '', reps: '', time: '', isTimerRunning: false };
      }
      initialData[exercise.id] = { sets };
    });
    setExerciseData(initialData);
  }, [workout]);

  const renderExerciseSets = (exercise) => {
    const currentExerciseData = exerciseData[exercise.id] || {};
    const currentSets = currentExerciseData.sets || {};
    const setsArray = Object.keys(currentSets).map(Number).sort((a, b) => a - b);

    return (
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={[styles.serieCell, styles.serieContainer]}>
            {setsArray.length > 1 && (
              <TouchableOpacity
                style={styles.setButton}
                onPress={() => removeSet(exercise.id)}
              >
                <Ionicons name="remove-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.tableHeader, styles.inputCell]}>Poids</Text>
          <Text style={[styles.tableHeader, styles.inputCell]}>Reps</Text>
          <Text style={[styles.tableHeader, styles.inputCell, styles.lastCell]}>Time</Text>
        </View>

        {/* Table Rows */}
        {setsArray.map((setIndex) => (
          <View key={`${exercise.id}-set-${setIndex}`} style={styles.tableRow}>
            <View style={[styles.serieCell]}>
              <Text style={styles.setText}>{setIndex + 1}</Text>
            </View>

            <View style={styles.inputCell}>
              <View style={styles.weightContainer}>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    const placeholderValue = getPlaceholder(exercise.id, setIndex, 'weight');
                    if (placeholderValue) {
                      handleInputChange(exercise.id, `weight_${setIndex}`, placeholderValue);
                    }
                  }}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(exercise.id, setIndex, 'weight')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="numeric"
                  value={currentExerciseData.sets?.[setIndex]?.weight || ''}
                  onChangeText={(value) => handleInputChange(exercise.id, `weight_${setIndex}`, value)}
                />
                <TouchableOpacity 
                  style={styles.incrementButton}
                  onPress={() => {
                    const currentValue = currentExerciseData.sets?.[setIndex]?.weight;
                    const placeholderValue = getPlaceholder(exercise.id, setIndex, 'weight');
                    const baseValue = currentValue || placeholderValue || '0';
                    const newValue = (parseInt(baseValue) + 1).toString();
                    handleInputChange(exercise.id, `weight_${setIndex}`, newValue);
                  }}
                >
                  <Text style={styles.copyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputCell}>
              <View style={styles.weightContainer}>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    const placeholderValue = getPlaceholder(exercise.id, setIndex, 'reps');
                    if (placeholderValue) {
                      handleInputChange(exercise.id, `reps_${setIndex}`, placeholderValue);
                    }
                  }}
                >
                  <Text style={styles.copyButtonText}>=</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(exercise.id, setIndex, 'reps')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="numeric"
                  value={currentExerciseData.sets?.[setIndex]?.reps || ''}
                  onChangeText={(value) => handleInputChange(exercise.id, `reps_${setIndex}`, value)}
                />
                <TouchableOpacity 
                  style={styles.incrementButton}
                  onPress={() => {
                    const currentValue = currentExerciseData.sets?.[setIndex]?.reps;
                    const placeholderValue = getPlaceholder(exercise.id, setIndex, 'reps');
                    const baseValue = currentValue || placeholderValue || '0';
                    const newValue = (parseInt(baseValue) + 1).toString();
                    handleInputChange(exercise.id, `reps_${setIndex}`, newValue);
                  }}
                >
                  <Text style={styles.copyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.inputCell, styles.lastCell]}>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={getPlaceholder(exercise.id, setIndex, 'time')}
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  keyboardType="decimal-pad"
                  value={exerciseData[exercise.id]?.sets?.[setIndex]?.time || ''}
                  onChangeText={(value) => {
                    // Store the display value (e.g., "1.3")
                    handleInputChange(exercise.id, `time_${setIndex}`, value);
                  }}
                />
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => {
                    const value = exerciseData[exercise.id]?.sets?.[setIndex]?.time;
                    const placeholder = getPlaceholder(exercise.id, setIndex, 'time');
                    const timeToUse = value || placeholder;
                    
                    if (timeToUse) {
                      const seconds = convertTimeToSeconds(timeToUse);
                      timerRef.current?.startTimer(seconds);
                    }
                  }}
                >
                  <Ionicons name="play-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        {/* Add series button */}
        <TouchableOpacity
          style={styles.setButton}
          onPress={() => addSet(exercise.id)}
        >
          <Ionicons name="add-circle" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
    );
  };

  const updateNoteHeight = (exerciseId, height) => {
    setNoteHeights(prev => ({
      ...prev,
      [exerciseId]: height
    }));
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.timerContainer}>
        <TimerDisplay ref={timerRef} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleNavigation}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{workout.name}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {workout.exercices.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseContainer}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={styles.noteContainer}>
              <View style={styles.noteInputContainer}>
                <TouchableOpacity
                  style={styles.clearNoteButton}
                  onPress={() => handleInputChange(exercise.id, 'note', '')}
                >
                  <Ionicons name="backspace-outline" size={16} color="#666" />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.noteInput,
                    { height: noteHeights[exercise.id] || 36 }
                  ]}
                  placeholder="Ajouter une note..."
                  placeholderTextColor="rgba(0, 0, 0, 0.3)"
                  value={exerciseData[exercise.id]?.note || ''}
                  onChangeText={(value) => handleInputChange(exercise.id, 'note', value)}
                  multiline
                  onContentSizeChange={(e) => 
                    updateNoteHeight(exercise.id, Math.max(36, e.nativeEvent.contentSize.height))
                  }
                  scrollEnabled={false}
                  textAlignVertical="top"
                />
              </View>
            </View>
            {renderExerciseSets(exercise)}
          </View>
        ))}

        <TouchableOpacity 
          style={styles.finishButton}
          onPress={() => {
            // TODO: Save workout data
            navigation.goBack();
          }}
        >
          <Text style={styles.finishButtonText}>Terminer l'entraînement</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  timerContainer: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 0,
    height: 40,
  },
  headerLeft: {
    width: 50,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  exerciseContainer: {
    padding: 1,
    marginHorizontal: 6,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableHeader: {
    fontWeight: '600',
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
  },
  serieCell: {
    width: 30,
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    padding: 2,
    height: 36,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  serieContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  input: {
    width: 40,
    height: 28,
    fontSize: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  setButton: {
    padding: 0,
  },
  setText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  noteContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  noteInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clearNoteButton: {
    padding: 8,
    marginRight: 4,
  },
  noteInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 15,
    height: 'auto',
    minHeight: 36,
  },
  finishButton: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 4,
    margin: 8,
    marginBottom: 16,
  },
  finishButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 2,
    height: 32,
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 3,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  serieButtonsContainer: {
    alignItems: 'center',
    marginBottom: 2,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playButton: {
    padding: 4,
  },
  timerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
});
