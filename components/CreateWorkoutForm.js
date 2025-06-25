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
  ScrollView,
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
  const [showTypeMenu, setShowTypeMenu] = useState(null); // Key: 'index' or 'index-altIndex'

  const exerciseTypes = [
    { id: 'muscu', label: '💪 Muscu' },
    { id: 'cardio', label: '🏃 Cardio' },
    { id: 'hiit', label: '⚡ HIIT' },
    { id: 'etirement', label: '🧘 Étirement' },
    { id: 'poids', label: '⚖️ Poids libre' }
  ];

  const handleAddExercise = () => {
    const exerciseId = `exercise_${Date.now()}`;
    setExercises((prev) => [
      ...prev,
      { 
        id: exerciseId, 
        name: "",
        type: 'muscu',
        alternatives: []
      },
    ]);
  };

  const handleUpdateExercise = (index, field, value) => {
    setExercises(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
    });
  };

  const handleRemoveExercise = (index) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAlternativeExercise = (exerciseIndex) => {
    setExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      if (!exercise.alternatives) {
        exercise.alternatives = [];
      }
      const alternativeId = `alt_${Date.now()}`;
      exercise.alternatives.push({
        id: alternativeId,
        name: '',
        type: 'muscu'
      });
      return updated;
    });
  };

  const handleUpdateAlternativeExercise = (exerciseIndex, altIndex, field, value) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].alternatives[altIndex] = {
        ...updated[exerciseIndex].alternatives[altIndex],
        [field]: value
      };
      return updated;
    });
  };

  const handleRemoveAlternativeExercise = (exerciseIndex, altIndex) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].alternatives.splice(altIndex, 1);
      return updated;
    });
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

            const finalExercises = exercises
              .map(ex => ({
                ...ex,
                alternatives: (ex.alternatives || []).filter(alt => alt.name.trim() !== '')
              }))
              .filter(ex => ex.name.trim() !== '');

            try {
              const user = auth.currentUser;
              if (!user) throw new Error("Utilisateur non connecté");

              const workoutData = {
                name,
                description,
                exercices: finalExercises,
                perf: {},
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              };

              const success = await createWorkout(workoutId, workoutData);

              if (success) {
                onCreated && onCreated(workoutId, name, description, finalExercises);

                if (!isOnline) {
                  Alert.alert(
                    "Enregistré localement", 
                    "L'entraînement a été créé en mode hors ligne et sera synchronisé automatiquement."
                  );
                } else {
                  Alert.alert("Succès", "Entraînement créé !");
                }
                
                setName("");
                setDescription("");
                setExercises([]);
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
          <ScrollView>
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
          {exercises.map((item, index) => {
            const mainTypeMenuKey = `${index}`;
            return (
            <View key={item.id} style={styles.exerciseItemContainer}>
              <View style={styles.exerciseItemRow}>
                <Text style={styles.exerciseIndex}>{index + 1}.</Text>
                <TextInput
                  style={[styles.input, styles.exerciseInput]}
                  placeholder="Nom exercice"
                  value={item.name}
                  onChangeText={(text) => handleUpdateExercise(index, 'name', text)}
                />
                <TouchableOpacity onPress={() => handleRemoveExercise(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>-</Text>
                </TouchableOpacity>
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
              <View style={styles.exerciseOptionsRow}>
                <Pressable 
                  style={styles.typeSelector}
                  onPress={() => setShowTypeMenu(showTypeMenu === mainTypeMenuKey ? null : mainTypeMenuKey)}
                >
                  <Text>{exerciseTypes.find(t => t.id === item.type)?.label || '💪 Muscu'}</Text>
                </Pressable>

                {showTypeMenu === mainTypeMenuKey && (
                  <View style={styles.typeMenu}>
                    {exerciseTypes.map((type) => (
                      <Pressable
                        key={type.id}
                        style={styles.typeMenuItem}
                        onPress={() => {
                          handleUpdateExercise(index, 'type', type.id);
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

                <TouchableOpacity style={styles.altExerciseButton} onPress={() => handleAddAlternativeExercise(index)}>
                  <Text style={styles.altExerciseButtonText}>+ Exo alternatif</Text>
                </TouchableOpacity>
              </View>

              {(item.alternatives || []).map((altItem, altIndex) => {
                const altTypeMenuKey = `${index}-${altIndex}`;
                return (
                  <View key={altItem.id} style={styles.altExerciseContainer}>
                    <View style={styles.altExerciseRow}>
                      <TextInput
                        style={[styles.input, styles.exerciseInput]}
                        placeholder="Nom exercice alternatif"
                        value={altItem.name}
                        onChangeText={(text) => handleUpdateAlternativeExercise(index, altIndex, 'name', text)}
                      />
                      <TouchableOpacity onPress={() => handleRemoveAlternativeExercise(index, altIndex)} style={styles.altRemoveButton}>
                        <Text style={styles.altRemoveButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.altExerciseOptionsRow}>
                      <Pressable 
                        style={styles.typeSelector}
                        onPress={() => setShowTypeMenu(showTypeMenu === altTypeMenuKey ? null : altTypeMenuKey)}
                      >
                        <Text>{exerciseTypes.find(t => t.id === altItem.type)?.label || '💪 Muscu'}</Text>
                      </Pressable>
                      {showTypeMenu === altTypeMenuKey && (
                        <View style={styles.typeMenu}>
                          {exerciseTypes.map((type) => (
                            <Pressable
                              key={type.id}
                              style={styles.typeMenuItem}
                              onPress={() => {
                                handleUpdateAlternativeExercise(index, altIndex, 'type', type.id);
                                setShowTypeMenu(null);
                              }}
                            >
                              <Text style={[styles.typeMenuText, altItem.type === type.id && styles.typeMenuTextSelected]}>
                                {type.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          )})}

          <TouchableOpacity onPress={handleAddExercise} style={styles.addButton}>
            <Text style={styles.addButtonText}>＋ Ajouter un exercice</Text>
          </TouchableOpacity>

          <ActionButton
            title="Créer"
            onPress={handleCreateWorkout}
            variant="primary"
          />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const styles = StyleSheet.create({
  typeSelector: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 15,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
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
    marginBottom: 0,
  },
  exerciseInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: 'bold',
  },
  exerciseItemContainer: {
    marginBottom: 15,
  },
  exerciseItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseIndex: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 25,
    position: 'relative',
  },
  altExerciseContainer: {
    marginTop: 10,
    marginLeft: 30, // Indent alternative exercises
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 10,
  },
  altExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  altExerciseOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  altExerciseButton: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  altExerciseButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ff4d4d',
    borderRadius: 5,
    marginRight: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  altRemoveButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4d4d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  altRemoveButtonText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 20, // Centrage vertical
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
