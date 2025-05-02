import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal, // Import du Modal
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import CreateWorkoutForm from "../components/CreateWorkoutForm";
import UserOptionsModal from "../components/UserOptionsModal";
import WorkoutItem from "../components/WorkoutItem";
import { useUser } from "../context/UserContext";

export default function HomeScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);
  const [showModalCreate, setShowModalCreate] = useState(false);
  const { user, nickname, workouts, setWorkouts, loading } = useUser();

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.replace("Login");
    }
  }, []);

  const handleWorkoutCreated = (workoutId, workoutName, workoutDescription, exercices) => {
    const newWorkout = {
      id: workoutId,
      name: workoutName,
      description: workoutDescription || "Aucune description",
      exercices: exercices || [],
    };

    // Mise à jour de l'état local
    setWorkouts((prevWorkouts) => {
      const updatedWorkouts = [...prevWorkouts, newWorkout];
      return updatedWorkouts;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ alignItems: "flex-end", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Image
              source={require("../assets/settings.png")}
              style={{ width: 30, height: 30 }}
            />
          </TouchableOpacity>
        </View>

        <UserOptionsModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onLogout={() => navigation.replace("Login")}
        />

        <Text style={styles.title}>Bienvenue {nickname} 👋</Text>

        <View>
          <TouchableOpacity onPress={() => setShowModalCreate(true)}>
            <Text style={styles.createButton}>+ Créer un workout</Text>
          </TouchableOpacity>

          <CreateWorkoutForm
            visible={showModalCreate}
            onCreated={handleWorkoutCreated}
            onClose={() => setShowModalCreate(false)}
          />
        </View>

        <Text style={styles.subtitle}>📋 Mes Workouts :</Text>
        {workouts.length === 0 ? (
          <Text>Aucun workout trouvé.</Text>
        ) : (
          workouts.map((workout) => (
            <WorkoutItem key={workout.id} workout={workout} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    flexGrow: 1,
  },

  title: { fontSize: 24, marginBottom: 15, textAlign: "center" },
  subtitle: { fontSize: 18, marginBottom: 10 },
  workoutItem: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  workoutTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  workoutDesc: {
    fontSize: 14,
    color: "#555",
  },
  createButton: {
    fontSize: 18,
    color: "#007bff",
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fond semi-transparent
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 0,
    borderRadius: 10,
    width: "80%",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",

    margin: 0,
    padding: 0,
  },
});
