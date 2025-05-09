import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ActionButton from "../components/ui/ActionButton";
import removeFromWorkouts from "../firebase_functions/remove_workout";
import { useUser } from "../context/UserContext";
import ModifyWorkoutForm from "../components/ModifyWorkoutForm";
import PerformanceTable from "../components/PerformanceTable";
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutDetailScreen({ route }) {
  const { workout } = route.params;

  if (workout.perf) {
    console.log("Perf dates:", Object.keys(workout.perf));
  }

  const navigation = useNavigation();
  const { user, setWorkouts } = useUser();
  const [showModifyModal, setShowModifyModal] = useState(false);

  const handleStartWorkout = () => {
    navigation.navigate("StartWorkout", { workout });
  };

  const handleDeleteWorkout = async () => {
    Alert.alert(
      "Supprimer l'entraînement",
      "Es-tu sûr de vouloir supprimer cet entraînement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              if (!workout || !user.uid) {
                console.error("workout ou user.uid manquant");
                Alert.alert("Erreur", "Les données nécessaires sont manquantes.");
                return;
              }

              const result = await removeFromWorkouts(workout, user.uid);
              setWorkouts((prevWorkouts) =>
                prevWorkouts.filter((w) => w.id !== workout.id)
              );
              Alert.alert("Succès", result);
              navigation.navigate("Home");
            } catch (error) {
              console.error("Erreur suppression entraînement:", error);
              Alert.alert("Erreur", "Erreur lors de la suppression.");
            }
          },
        },
      ]
    );
  };

  const handleModifyWorkout = () => {
    setShowModifyModal(true);
  };

  const handleWorkoutModified = (modifiedWorkout) => {
    // Update workouts in context
    setWorkouts((prevWorkouts) =>
      prevWorkouts.map((w) =>
        w.id === modifiedWorkout.id ? modifiedWorkout : w
      )
    );
    // Update the local workout state
    route.params.workout = modifiedWorkout;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Container */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{workout.name}</Text>
        </View>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.dateInfo}>
          {workout.createdAt && (
            <Text style={styles.dateText}>
              Créé le {new Date(workout.createdAt?.toDate?.() || workout.createdAt).toLocaleDateString()}
            </Text>
          )}
          {workout.lastModified && (
            <Text style={styles.dateText}>
              Modifié le {new Date(workout.lastModified?.toDate?.() || workout.lastModified).toLocaleDateString()}
            </Text>
          )}
         
        </View>
      </View>
 {/* Actions Section */}
 <View style={styles.actionsContainer}>
        <ActionButton
          title="Commencer l'entraînement"
          onPress={handleStartWorkout}
          variant="primary"
          style={styles.button}
        />
        <ActionButton
          title="Modifier"
          onPress={handleModifyWorkout}
          variant="secondary"
          style={styles.button}
        />
        <ActionButton
          title="Supprimer"
          onPress={handleDeleteWorkout}
          variant="danger"
          style={styles.button}
        />
      </View>
      {/* Description Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {workout.description || "Aucune description"}
        </Text>
      </View>

      {/* Exercises Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercices</Text>
        {workout.exercices && workout.exercices.length > 0 ? (
          workout.exercices.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <Text style={styles.exerciseText}>
                {index + 1}. {exercise.name}
              </Text>
              {exercise.description && (
                <Text style={styles.exerciseDescription}>
                  {exercise.description}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noExercises}>Aucun exercice</Text>
        )}
      </View>
 

      {/* Modify Workout Modal */}
      <ModifyWorkoutForm
        visible={showModifyModal}
        workout={workout}
        onModified={handleWorkoutModified}
        onClose={() => setShowModifyModal(false)}
      />
      {/* Performance History Section */}
      {workout.perf && Object.keys(workout.perf).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des performances</Text>
          <PerformanceTable 
            perf={workout.perf} 
            exercises={workout.exercices}
          />
        </View>
      )}

    
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginTop: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 40,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSection: {
    padding: 9,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  dateInfo: {
    flexDirection: "column",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  lastTrainingText: {
    color: "#2196F3",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },
  exerciseItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  exerciseText: {
    fontSize: 16,
    color: "#333",
  },
  exerciseDescription: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  noExercises: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    padding: 10,
    flexWrap: "wrap",
  },
  button: {
    minWidth: 150,
  },
});
