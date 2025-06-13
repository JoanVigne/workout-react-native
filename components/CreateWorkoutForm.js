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
  Pressable,
} from "react-native";
import { auth } from "../firebase";
import CloseButton from "./ui/CloseButton";
import ActionButton from "./ui/ActionButton";
import { useUser } from "../context/UserContext";

export default function CreateWorkoutForm({ visible, onCreated, onClose }) {
  const { createWorkout, isOnline } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState("");
  const [exerciseType, setExerciseType] = useState("muscu");
  const [showTypeMenu, setShowTypeMenu] = useState(null); // Pour le menu déroulant

  const exerciseTypes = [
    { id: 'muscu', label: '💪 Muscu' },
    { id: 'cardio', label: '🏃 Cardio' },
    { id: 'hiit', label: '⚡ HIIT' },
    { id: 'etirement', label: '🧘 Étirement' },
    { id: 'poids', label: '⚖️ Poids libre' }
  ];

  const exerciseInputRef = useRef(null);

  const handleAddExercise = () => {
    if (!newExercise.trim()) return;

    const exerciseId = `${newExercise
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")}_${Date.now()}`;

    setExercises((prev) => [
      ...prev,
      { 
        id: exerciseId, 
        name: newExercise.trim(),
        type: exerciseType // Ajout du type d'exercice
      },
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

              const workoutData = {
                name,
                description,
                exercices: exercises,
                perf: {},
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              };

              // Utiliser la fonction createWorkout du UserContext qui gère le mode hors ligne
              const success = await createWorkout(workoutId, workoutData);

              if (success) {
                onCreated && onCreated(workoutId, name, description, exercises);

                // Message différent selon l'état de la connexion
                if (!isOnline) {
                  Alert.alert(
                    "Enregistré localement", 
                    "L'entraînement a été créé en mode hors ligne et sera synchronisé automatiquement lorsque vous serez connecté à Internet."
                  );
                } else {
                  Alert.alert("Succès", "Entraînement créé !");
                }
                
                setName("");
                setDescription("");
                setExercises([]);
                setNewExercise("");
                onClose && onClose();
              } else {
                Alert.alert("Erreur", "Impossible de créer l'entraînement. Veuillez réessayer.");
              }
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
              <Pressable 
                style={styles.typeSelector}
                onPress={() => setShowTypeMenu(showTypeMenu === index ? null : index)}
              >
                <Text>{exerciseTypes.find(t => t.id === item.type)?.label || '💪 Muscu'}</Text>
              </Pressable>

              {showTypeMenu === index && (
                <View style={styles.typeMenu}>
                  {exerciseTypes.map((type) => (
                    <Pressable
                      key={type.id}
                      style={styles.typeMenuItem}
                      onPress={() => {
                        setExercises(prev => prev.map((ex, i) => 
                          i === index ? { ...ex, type: type.id } : ex
                        ));
                        setShowTypeMenu(null);
                      }}
                    >
                      <Text style={[styles.typeMenuText, item.type === type.id && styles.typeMenuTextSelected]}>
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

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
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const styles = StyleSheet.create({
  typeSelector: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    minWidth: 100,
  },
  typeMenu: {
    position: 'absolute',
    left: 0,
    top: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  typeMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  typeMenuText: {
    fontSize: 14,
    color: '#333',
  },
  typeMenuTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    color: '#666',
    fontSize: 14,
  },
  typeTextActive: {
    color: '#fff',
  },
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
