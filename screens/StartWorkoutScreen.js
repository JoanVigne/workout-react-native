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
import ExerciseType from '../components/ExerciseType';
import TimerDisplay from '../components/TimerDisplay';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import CardioExercise from '../components/type_exercices/Cardio';
import EtirementExercise from "../components/type_exercices/Etirement";
import HiitExercise from "../components/type_exercices/Hiit";
import MuscuExercise from "../components/type_exercices/Muscu";
export default function StartWorkoutScreen({ route, navigation }) {
  const [workout, setWorkout] = useState(route.params.workout);

  // Convertir les dates en chaînes ISO pour éviter les problèmes de sérialisation
  useEffect(() => {
    if (route.params.workout) {
      setWorkout({
        ...route.params.workout,
        lastModified: route.params.workout.lastModified?.toISOString?.() || route.params.workout.lastModified,
        createdAt: route.params.workout.createdAt?.toISOString?.() || route.params.workout.createdAt
      });
    }
  }, [route.params.workout]);
  const [exerciseData, setExerciseData] = useState({});
  const [noteHeights, setNoteHeights] = useState({});
  const timerRef = useRef();
  const { setWorkouts } = useUser();

  // Check if there are any unsaved changes
  const hasUnsavedChanges = () => {
    console.log('Checking changes:', exerciseData);
    const hasChanges = Object.values(exerciseData).some(exercise => {
      if (!exercise?.sets) return false;
      return Object.values(exercise.sets).some(set => {
        const hasValue = Boolean(set.weight || set.reps || set.time);
        
        return hasValue;
      });
    });
  
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
            navigation.goBack();
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
      // Ne plus bloquer la navigation
      return;
    });

    return unsubscribe;
  }, [navigation]);

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

    // Count the number of sets by looking at weight, reps or time entries
    let setCount = 0;
    while (lastPerf[`weight${setCount}`] !== undefined || 
           lastPerf[`reps${setCount}`] !== undefined || 
           lastPerf[`interval${setCount}`] !== undefined) {
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
    // Handle notes separately
    if (field === 'note') {
      setExerciseData(prevData => ({
        ...prevData,
        [exerciseId]: {
          ...prevData[exerciseId],
          note: value
        }
      }));
      return;
    }
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
    const lastPerformance = getLastPerformance(exercise.id);

    switch(exercise.type) {
      case 'muscu':
        return <MuscuExercise 
          exercise={{ ...exercise, lastPerformance }} 
          onUpdateExercise={(updatedExercise) => {
            setExerciseData(prev => ({
              ...prev,
              [exercise.id]: updatedExercise
            }));
          }}
          timerRef={timerRef}
        />;
      case 'cardio':
        return <CardioExercise 
          exercise={{ ...exercise, lastPerformance }} 
          onUpdateExercise={(updatedExercise) => {
            setExerciseData(prev => ({
              ...prev,
              [exercise.id]: updatedExercise
            }));
          }}
          timerRef={timerRef}
        />;
      case 'etirement':
        return <EtirementExercise 
          exercise={{ ...exercise, lastPerformance }} 
          onUpdateExercise={(updatedExercise) => {
            setExerciseData(prev => ({
              ...prev,
              [exercise.id]: updatedExercise
            }));
          }}
          timerRef={timerRef}
        />;
      case 'hiit':
        return <HiitExercise 
          exercise={{ ...exercise, lastPerformance }} 
          onUpdateExercise={(updatedExercise) => {
            setExerciseData(prev => ({
              ...prev,
              [exercise.id]: updatedExercise
            }));
          }} 
        />;
      default:
        return null;
    }
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
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exercise.type && <ExerciseType type={exercise.type} />}
            </View>
            
            {renderExerciseSets(exercise)}

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
          </View>
        ))}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.quitButton}
            onPress={handleNavigation}
          >
            <Text style={styles.quitButtonText}>Quitter entraînement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.finishButton}
            onPress={() => {
              Alert.alert(
                'Terminer l\'entraînement',
                'Avez-vous fini l\'entraînement ?',
                [
                  { text: 'Non', style: 'cancel' },
                  { 
                    text: 'Oui', 
                    style: 'default', 
                    onPress: async () => {
                    try {
                      const user = auth.currentUser;
                      if (!user) {
                        Alert.alert('Erreur', 'Vous devez être connecté pour sauvegarder un entraînement');
                        return;
                      }

                      // Format the workout data
                      const today = new Date().toISOString().split('T')[0];
                      const workoutRef = doc(db, 'workouts', user.uid);
                      
                      // Create the update object with the old format
                      const formattedData = {};
                      
                      Object.entries(exerciseData).forEach(([exerciseId, data], index) => {
                        const exercisePerf = {
                          exoOrder: index.toString() // Add exoOrder starting from 0
                        };
                        
                        // Add note if exists
                        if (data.note) {
                          exercisePerf.note = data.note;
                        }
                        
                        // Format sets data
                        if (data.sets) {
                          Object.entries(data.sets).forEach(([setIndex, setData]) => {
                            if (setData.reps) exercisePerf[`reps${setIndex}`] = setData.reps;
                            if (setData.weight) exercisePerf[`weight${setIndex}`] = setData.weight;
                            if (setData.time) exercisePerf[`interval${setIndex}`] = setData.time;
                          });
                        }
                        
                        formattedData[exerciseId] = exercisePerf;
                      });
                      
                      const updateData = {
                        [`${workout.id}.perf.${today}`]: formattedData
                      };

                      // Save to Firebase
                      await updateDoc(workoutRef, updateData);

                      // Refresh context
                      const workoutsDoc = await getDoc(doc(db, 'workouts', user.uid));
                      if (workoutsDoc.exists()) {
                        const data = workoutsDoc.data();
                        const workoutList = Object.keys(data).map((key) => ({
                          id: key,
                          name: data[key].name || 'Sans nom',
                          description: data[key].description || '',
                          exercices: data[key].exercices || [],
                          perf: data[key].perf || {},
                          createdAt: data[key].createdAt,
                          lastModified: data[key].lastModified
                        }));
                        setWorkouts(workoutList);
                      }

                      // Calculer les statistiques de l'entraînement
                      const stats = {
                        duration: '1h 30min', // À implémenter : calcul réel de la durée
                        exerciseCount: workout.exercices.length,
                        totalSets: Object.values(exerciseData).reduce((total, exercise) => {
                          return total + (exercise.sets ? Object.keys(exercise.sets).length : 0);
                        }, 0)
                      };

                      // Si tout s'est bien passé, naviguer vers TrainingOver
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'TrainingOver', params: { workoutData: stats } }],
                      });
                    } catch (error) {
                      console.error('Erreur sauvegarde entraînement:', error);
                      Alert.alert(
                        'Erreur',
                        'Impossible de sauvegarder l\'entraînement. Veuillez réessayer.'
                      );
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.finishButtonText}>Terminer l'entraînement</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
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
    minHeight: 40,
    paddingVertical: 8,
  },
  headerLeft: {
    width: 50,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerRight: {
    width: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: 22,
  },
  closeButton: {
    padding: 8,
  },
  exerciseContainer: {
    padding: 1,
    marginHorizontal: 6,
    marginBottom: 24,
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 120,
    paddingHorizontal: 8,
  },
  quitButton: {
    backgroundColor: "#f44336",
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  quitButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  finishButton: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 4,
    flex: 1,
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
