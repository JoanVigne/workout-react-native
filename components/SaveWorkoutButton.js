import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SaveWorkoutButton({ 
  workout, 
  exerciseData, 
  onSaved, 
  style 
}) {
  const handleSave = async () => {
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

                // Add sets data
                if (data.sets) {
                  Object.entries(data.sets).forEach(([setIndex, setData]) => {
                    if (setData.weight) exercisePerf[`weight${setIndex}`] = setData.weight;
                    if (setData.reps) exercisePerf[`reps${setIndex}`] = setData.reps;
                    if (setData.time) exercisePerf[`interval${setIndex}`] = setData.time;
                  });
                }

                formattedData[exerciseId] = exercisePerf;
              });

              // Create the update object
              const updateData = {
                [`perf.${today}`]: formattedData
              };

              // Update the document
              await updateDoc(workoutRef, updateData);
              
              Alert.alert('Succès', 'Entraînement sauvegardé !');
              onSaved && onSaved();
            } catch (error) {
              console.error('Error saving workout:', error);
              Alert.alert('Erreur', 'Impossible de sauvegarder l\'entraînement');
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.finishButton, style]}
      onPress={handleSave}
    >
      <Text style={styles.finishButtonText}>Terminer l'entraînement</Text>
    </TouchableOpacity>
  );
}

SaveWorkoutButton.propTypes = {
  workout: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  exerciseData: PropTypes.object.isRequired,
  onSaved: PropTypes.func,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
