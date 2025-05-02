import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const removeFromWorkouts = async (data, userId, setWorkouts = null) => {
  try {
    // Référence au document de l'utilisateur dans la collection "workouts"
    const userWorkoutsRef = doc(db, "workouts", userId);

    console.log("Attempting to delete workout...");
    console.log("User ID: ", userId);
    console.log("Workout ID: ", data.id);

    // Vérifier si le document existe
    const docSnap = await getDoc(userWorkoutsRef);
    if (!docSnap.exists()) {
      console.log("User workouts document not found");
      return "User workouts document not found";
    }

    // Créer un objet pour la mise à jour où on supprime le workout spécifique
    const updateData = {};
    updateData[data.id] = deleteField();

    // Mettre à jour le document en supprimant le workout spécifique
    await updateDoc(userWorkoutsRef, updateData);

    // Mettre à jour le stockage local si nécessaire
    try {
      let storedWorkouts = await AsyncStorage.getItem("workouts");
      if (storedWorkouts) {
        storedWorkouts = JSON.parse(storedWorkouts);
        delete storedWorkouts[data.id];
        await AsyncStorage.setItem("workouts", JSON.stringify(storedWorkouts));
      }
    } catch (storageError) {
      console.warn("Error updating AsyncStorage", storageError);
      // Continue même si AsyncStorage échoue
    }

    console.log("Workout removed successfully");
    return "Entraînement supprimé avec succès";
  } catch (error) {
    console.error("Error removing workout", error);
    throw error; // Propager l'erreur pour la gérer dans le composant
  }
};

export default removeFromWorkouts;
