import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TrainingOver = ({ route }) => {
  const navigation = useNavigation();
  const { workoutData } = route.params || {};

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entraînement Terminé !</Text>
      
      {workoutData && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Résumé :</Text>
          <Text style={styles.statsText}>Durée : {workoutData.duration || 'N/A'}</Text>
          <Text style={styles.statsText}>Exercices : {workoutData.exerciseCount || 0}</Text>
          <Text style={styles.statsText}>Séries totales : {workoutData.totalSets || 0}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleGoHome}>
        <Text style={styles.buttonText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
  },
  statsText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TrainingOver;
