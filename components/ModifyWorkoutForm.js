import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import CloseButton from "./ui/CloseButton";
import ActionButton from "./ui/ActionButton";
import { useUser } from "../context/UserContext";

const exerciseTypes = [
  { value: 'muscu', label: 'Muscu' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'etirement', label: 'Étirement' },
  { value: 'poids', label: 'Poids libre' },
];

export default function ModifyWorkoutForm({ visible, workout, onModified, onClose }) {
  const { updateWorkout } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState("");
  const [exerciseType, setExerciseType] = useState("muscu");

  // Initialiser les champs avec les données du workout
  useEffect(() => {
    if (workout) {
      setName(workout.name || "");
      setDescription(workout.description || "");
      setExercises(workout.exercises || []);
    }
  }, [workout]);

  const handleAddExercise = () => {
    if (!newExercise.trim()) return;

    const exerciseId = `${newExercise.trim().toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    
    setExercises((prev) => [
      ...prev,
      {
        id: exerciseId,
        name: newExercise.trim(),
        type: exerciseType
      }
    ]);
    
    setNewExercise("");
  };

  const handleRemoveExercise = (id) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleModifyWorkout = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour l'entraînement");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins un exercice");
      return;
    }

    try {
      await updateWorkout(workout.id, {
        name: name.trim(),
        description: description.trim(),
        exercises: exercises,
        lastModified: new Date().toISOString(),
      });

      onModified();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      Alert.alert("Erreur", "Impossible de modifier l'entraînement");
    }
  };

  const renderExerciseTypeLabel = () => {
    const selectedType = exerciseTypes.find(type => type.value === exerciseType);
    return selectedType ? selectedType.label : 'Type';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <CloseButton onPress={onClose} />
          <Text style={styles.label}>Nom de l'entraînement</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            value={name}
            onChangeText={setName}
          />
          
          <Text style={styles.label}>Description (optionnelle)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder=""
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          
          <Text style={styles.label}>Exercices</Text>
          <ScrollView style={styles.exerciseList}>
            {exercises.length === 0 ? (
              <Text style={styles.emptyMessage}>Aucun exercice ajouté</Text>
            ) : (
              exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseText}>{exercise.name}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveExercise(exercise.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
          
          <View style={styles.exerciseInputRow}>
            <TouchableOpacity 
              style={styles.typeSelector}
              onPress={() => {
                const nextIndex = exerciseTypes.findIndex(t => t.value === exerciseType) + 1;
                setExerciseType(exerciseTypes[nextIndex % exerciseTypes.length].value);
              }}
            >
              <Text>{renderExerciseTypeLabel()}</Text>
              <Ionicons name="chevron-down" size={16} color="#555" style={{marginLeft: 4}} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, {flex: 1, marginBottom: 0}]}
              placeholder="Nouvel exercice"
              value={newExercise}
              onChangeText={setNewExercise}
            />
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddExercise}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <ActionButton
            title="Modifier"
            onPress={handleModifyWorkout}
            variant="primary"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  exerciseList: {
    maxHeight: 150,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    marginBottom: 6,
  },
  exerciseText: {
    flex: 1,
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 20,
    color: "#ff4444",
    fontWeight: "bold",
  },
  emptyMessage: {
    fontStyle: "italic",
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  exerciseInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  typeSelector: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 8,
    height: 40,
    justifyContent: 'center',
  },
  addButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
