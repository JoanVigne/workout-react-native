import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Importation de la base de données et auth
import { doc, setDoc } from "firebase/firestore"; // Importation des méthodes Firestore
import MorpionModal from "../components/MorpionModal";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showModal, setShowModal] = useState(true); // On montre le jeu dès le début
  const [isGameWon, setIsGameWon] = useState(false); // Etat pour savoir si le joueur a gagné le jeu

  const handleRegister = async () => {
    if (!isGameWon) {
      Alert.alert("Erreur", "Tu dois gagner au Morpion pour t'inscrire.");
      return; // Ne pas permettre l'inscription si le joueur n'a pas gagné
    }

    try {
      // Créer un nouvel utilisateur avec email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Créer une référence au document avec l'UID de l'utilisateur
      const userRef = doc(db, "users", user.uid); // Référence à un document dans la collection "users"

      // Créer le document pour cet utilisateur dans la collection "users"
      await setDoc(userRef, {
        nickname: nickname,
        email: user.email,
        createdAt: new Date(),
        role: "free", 
      });

      // Afficher un message de succès
      Alert.alert("✅ Compte créé avec succès !");

      // Rediriger vers la page de connexion après inscription
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Erreur", error.message); // Afficher le message d'erreur si l'inscription échoue
    }
  };

  // Cette fonction sera appelée si le joueur gagne
  const handleGameWin = () => {
    setIsGameWon(true); // Le joueur a gagné le jeu
    setShowModal(false); // Fermer le modal du jeu
    Alert.alert("Tu as gagné ! Maintenant tu peux t'inscrire.");
  };

  return (
    <View style={styles.container}>
      {/* Dès que l'utilisateur clique sur "S'inscrire", on affiche le jeu */}
      <MorpionModal
        visible={showModal} // Le modal est visible jusqu'à la victoire
        onClose={() => setShowModal(false)}
        onWin={handleGameWin} // Passer la fonction qui marque la victoire
      />
      <Text style={styles.title}>Créer un compte</Text>
      <TextInput
        style={styles.input}
        placeholder="Nickname"
        onChangeText={setNickname}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title="S'inscrire" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
});
