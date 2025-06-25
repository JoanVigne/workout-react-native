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
import Loading from "../components/ui/Loading";
import NetworkStatus from "../components/ui/NetworkStatus";
import SyncIndicator from "../components/ui/SyncIndicator";
import { useUser } from "../context/UserContext";

export default function HomeScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);
  const [showModalCreate, setShowModalCreate] = useState(false);
  const { user, nickname, workouts, setWorkouts, loading } = useUser();

  useEffect(() => {
    if (!loading && !auth.currentUser) {
      navigation.replace("Login");
    }
  }, [workouts, loading, user, navigation]);

  const handleWorkoutCreated = (workoutId, workoutName, workoutDescription, exercices) => {
    // Le contexte utilisateur (useUser) se charge déjà de mettre à jour la liste des entraînements.
    // Cette fonction est conservée pour la prop `onCreated` mais n'a plus besoin de modifier l'état localement.
    console.log(`Workout ${workoutName} créé avec succès.`);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          {/* Indicateur de statut réseau */}
          <NetworkStatus />
          
          {/* Bouton paramètres */}
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
        {loading ? (
          <Loading 
            text="Chargement des workouts..." 
            style={styles.loadingContainer} 
          />
        ) : workouts.length === 0 ? (
          <Text style={styles.noWorkoutsText}>Aucun workout trouvé.</Text>
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
    paddingBottom: 120,
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    marginVertical: 20,
  },
  noWorkoutsText: {
    textAlign: "center",
    color: "#666",
  },

  title: { fontSize: 27, marginBottom: 15, textAlign: "center" },
  subtitle: { fontSize: 22, marginBottom: 10,textAlign: "center" },
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
