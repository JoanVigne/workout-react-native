import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import CloseButton from "./ui/CloseButton";
import ActionButton from "./ui/ActionButton";
import ExerciseType from "./ExerciseType";
import { Ionicons } from '@expo/vector-icons';

const exerciseTypes = [
  { value: 'muscu', label: 'Muscu' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'etirement', label: 'Étirement' },
  { value: 'poids', label: 'Poids libre' },
];

export default function ModifyWorkoutForm({ visible, workout, onModified, onClose }) {
  const [name, setName] = useState(workout?.name || "");
  const [description, setDescription] = useState(workout?.description || "");
  const [exercises, setExercises] = useState(workout?.exercices || []);
  const [newExercise, setNewExercise] = useState("");

  const exerciseInputRef = useRef(null);

  useEffect(() => {
    if (workout) {
      setName(workout.name || "");
      setDescription(workout.description || "");
      setExercises(workout.exercices || []);
    }
  }, [workout]);

  const handleAddExercise = () => {
    if (!newExercise.trim()) return;

    const exerciseId = `${newExercise
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")}_${Date.now()}`;

    setExercises((prev) => [
      ...prev,
      { id: exerciseId, name: newExercise.trim(), type: 'muscu' },
    ]);

    setNewExercise("");
    Keyboard.dismiss();
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises((prev) => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleModifyWorkout = () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir modifier cet entraînement ?",
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

            try {
              const user = auth.currentUser;
              if (!user) throw new Error("Utilisateur non connecté");
              if (!workout) throw new Error("Données de l'entraînement manquantes");

              // Prepare the updated workout data
              const updatedWorkout = {
                ...workout,
                name,
                description,
                exercices: exercises,
                lastModified: new Date(),
                // Add createdAt if it doesn't exist
                createdAt: workout.createdAt || new Date(),
              };

              // Update the workout in Firestore
              const workoutRef = doc(db, "workouts", user.uid);
              await updateDoc(workoutRef, {
                [workout.id]: updatedWorkout,
              });

              // Notify parent component
              onModified && onModified(updatedWorkout);

              Alert.alert("Succès", "Entraînement modifié !");
              onClose && onClose();
            } catch (err) {
              console.error("Erreur modification entraînement :", err);
              Alert.alert("Erreur", err.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Modifier l'entraînement</Text>
              <CloseButton onPress={onClose} />
            </View>

            <ScrollView style={styles.scrollContent}>
              {/* Basic Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de l'entraînement"
                  value={name}
                  onChangeText={setName}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optionnelle)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Exercises Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Exercices</Text>
                
                {/* Existing Exercises */}
                {exercises.map((exercise, index) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseRow}>
                      <Text style={styles.exerciseText}>
                        {index + 1}. {exercise.name}
                      </Text>
                      <View style={styles.exerciseActions}>
                        <Pressable
                          onPress={() => {
                            const currentTypeIndex = exerciseTypes.findIndex(t => t.value === exercise.type);
                            const nextTypeIndex = (currentTypeIndex + 1) % exerciseTypes.length;
                            const newType = exerciseTypes[nextTypeIndex].value;
                            setExercises(prev => prev.map(ex => 
                              ex.id === exercise.id ? { ...ex, type: newType } : ex
                            ));
                          }}
                          style={styles.typeButton}
                        >
                          <View style={styles.typeButtonContent}>
                            <ExerciseType type={exercise.type || 'muscu'} />
                            <Ionicons name="swap-horizontal" size={16} color="#666" style={styles.editIcon} />
                          </View>
                        </Pressable>
                        <TouchableOpacity 
                          onPress={() => handleRemoveExercise(exercise.id)}
                          style={styles.removeButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Add Exercise Input */}
                <View style={styles.addExerciseContainer}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={exerciseInputRef}
                      style={styles.exerciseInput}
                      placeholder="Nouvel exercice"
                      value={newExercise}
                      onChangeText={setNewExercise}
                      onSubmitEditing={handleAddExercise}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleAddExercise}
                    style={styles.addButton}
                  >
                    <Ionicons name="add-circle" size={30} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <ActionButton
                title="Enregistrer"
                onPress={handleModifyWorkout}
                variant="primary"
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeButton: {
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  typeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginLeft: 10,
    height: 45,
    width: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  modalContent: {
    backgroundColor: "white",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    height: 45,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
  },
  exerciseText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 24,
    color: "#ff4444",
    fontWeight: "bold",
  },
  addExerciseContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  exerciseInput: {
    flex: 1,
    marginBottom: 0,
    height: 45,
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  saveButton: {
    marginBottom: 0,
  },
});
