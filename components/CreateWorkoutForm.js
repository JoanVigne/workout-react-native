import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Keyboard,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import CloseButton from "./ui/CloseButton";
import ActionButton from "./ui/ActionButton";

export default function CreateWorkoutForm({ visible, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState("");

  const exerciseInputRef = useRef(null);

  const handleAddExercise = () => {
    if (!newExercise.trim()) return;

    const exerciseId = `${newExercise
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")}_${Date.now()}`;

    setExercises((prev) => [
      ...prev,
      { id: exerciseId, name: newExercise.trim() },
    ]);

    setNewExercise("");
    Keyboard.dismiss();
  };

  const handleCreateWorkout = () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir créer cet entraînement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            if (!name.trim()) {
              Alert.alert(
                "Nom requis",
                "Le nom de l'entraînement est obligatoire."
              );
              return;
            }

            const workoutId = `${name
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "_")}_${Date.now()}`;

            try {
              const user = auth.currentUser;
              if (!user) throw new Error("Utilisateur non connecté");

              await setDoc(
                doc(db, "workouts", workoutId),
                {
                  id: workoutId,
                  userId: user.uid,
                  name,
                  description,
                  createdAt: new Date(),
                  exercices: exercises,
                }
              );

              onCreated && onCreated(workoutId, name, description, exercises);

              Alert.alert("Succès", "Entraînement créé !");
              setName("");
              setDescription("");
              setExercises([]);
              setNewExercise("");
              onClose && onClose();
            } catch (err) {
              console.error("Erreur création entraînement :", err);
              Alert.alert("Erreur", err.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const moveExercise = (fromIndex, toIndex) => {
    setExercises((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <CloseButton onPress={onClose} />
          <Text style={styles.label}>Nom de l'entraînement</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Objectif, durée, etc."
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Exercices</Text>
          <View style={styles.exerciseInputRow}>
            <TextInput
              ref={exerciseInputRef}
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Ajouter un exercice"
              value={newExercise}
              onChangeText={setNewExercise}
              onSubmitEditing={handleAddExercise}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAddExercise}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>
          </View>

          {exercises.map((item, index) => (
            <View key={`${item.id}_${index}`} style={styles.exerciseItemRow}>
              <Text style={styles.exerciseItemText}>
                {index + 1}. {item.name}
              </Text>

              <View style={styles.arrows}>
                {index > 0 && (
                  <TouchableOpacity
                    onPress={() => moveExercise(index, index - 1)}
                    style={styles.arrowButton}
                  >
                    <Text style={styles.arrow}>↑</Text>
                  </TouchableOpacity>
                )}
                {index < exercises.length - 1 && (
                  <TouchableOpacity
                    onPress={() => moveExercise(index, index + 1)}
                    style={styles.arrowButton}
                  >
                    <Text style={styles.arrow}>↓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <ActionButton
            title="Créer"
            onPress={handleCreateWorkout}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // foncé derrière
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    paddingTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  exerciseInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButtonText: {
    alignItems: "center",
    fontSize: 22,
    color: "#fff",
  },
  exerciseItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingLeft: 8,
  },
  exerciseItemText: {
    fontSize: 16,
    flex: 1,
  },
  arrows: {
    flexDirection: "row",
  },
  arrowButton: {
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
    marginLeft: 5,
  },
  arrow: {
    fontSize: 24,
    color: "#007bff",
  },
});
