import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ActionButton from "./ui/ActionButton";

const WorkoutItem = ({ workout }) => {
  const navigation = useNavigation();

  if (!workout) {
    return null;
  }

  console.log('Workout data:', JSON.stringify(workout, null, 2));

  const handleView = () => {
    navigation.navigate("WorkoutDetail", { workout });
  };

  const handleStart = () => {
    navigation.navigate("StartWorkout", { workout });
  };

  return (
    <View style={styles.workoutItem}>
      <Text style={styles.workoutTitle}>{workout.name || "Nom inconnu"}</Text>
      <Text style={styles.workoutDesc}>
        {workout.description || "Pas de description"}
      </Text>

      <View style={styles.exercisesList}>
        <Text style={styles.exercisesTitle}>Exercices:</Text>
        <Text style={styles.exerciseItem}>
          {Array.isArray(workout.exercices) && workout.exercices.length > 0 
            ? workout.exercices.map(exercice => exercice.name).join(", ")
            : "Aucun exercice ajouté"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <ActionButton title="Voir" onPress={handleView} variant="secondary" />
        <ActionButton title="Start" onPress={handleStart} variant="primary" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  workoutItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  workoutDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  exercisesList: {
    marginVertical: 8,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseItem: {
    fontSize: 14,
    color: "#444",
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});

export default WorkoutItem;
