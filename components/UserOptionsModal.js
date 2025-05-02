import React, { useState } from "react";
import { Modal, View, Text, TextInput, StyleSheet, Alert } from "react-native";
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import CloseButton from "../components/ui/CloseButton";
import ActionButton from "../components/ui/ActionButton"; // Importer le composant Button
import { useUser } from "../context/UserContext";

export default function UserOptionsModal({ visible, onClose, onLogout }) {
  const [newNickname, setNewNickname] = useState("");
  const [password, setPassword] = useState("");
  const userConnected = auth.currentUser;
  const { user, nickname, workouts, loading } = useUser();
  const emailUser = user && user.email;

  const handleChangeNickname = async () => {
    try {
      if (!userConnected) return;

      await updateDoc(doc(db, "users", userConnected.uid), {
        nickname: newNickname,
      });

      Alert.alert("Succès", "Pseudo mis à jour !");
      setNewNickname("");
    } catch (error) {
      console.error("Erreur update nickname", error);
      Alert.alert("Erreur", "Impossible de changer le pseudo.");
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = async () => {
    try {
      if (!userConnected) throw new Error("Utilisateur non connecté");

      // Re-authentification avec le mot de passe actuel
      const credential = EmailAuthProvider.credential(
        userConnected.email,
        currentPassword
      );
      await reauthenticateWithCredential(userConnected, credential);

      // Mise à jour du mot de passe
      await updatePassword(userConnected, newPassword);

      Alert.alert("Succès", "Mot de passe modifié !");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Erreur changement mot de passe", error);
      Alert.alert("Erreur", "Impossible de changer le mot de passe.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        userConnected.email,
        password
      );
      await reauthenticateWithCredential(userConnected, credential);

      await deleteDoc(doc(db, "users", userConnected.uid));
      await deleteDoc(doc(db, "workouts", userConnected.uid));
      await deleteUser(userConnected);

      Alert.alert("Compte supprimé.");
      onClose();
      onLogout();
    } catch (error) {
      console.error("Erreur suppression compte", error);
      Alert.alert("Erreur", "Échec suppression. Vérifie ton mot de passe.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Erreur logout", error);
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CloseButton onPress={onClose} />
        <Text style={styles.title}>Options utilisateur</Text>
        <Text style={styles.email}>{emailUser}</Text>
        <Text style={styles.email}>{nickname}</Text>
        <TextInput
          placeholder="Nouveau pseudo"
          value={newNickname}
          onChangeText={setNewNickname}
          style={styles.input}
        />
        <ActionButton
          title="Changer le pseudo"
          onPress={handleChangeNickname}
          variant="primary"
        />
        <View style={styles.separator} />

        <TextInput
          placeholder="Mot de passe actuel"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.input}
        />
        <TextInput
          placeholder="Nouveau mot de passe"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
        />
        <ActionButton
          title="Changer le mot de passe"
          onPress={handleChangePassword}
          variant="success"
        />
        <View style={styles.separator} />

        <TextInput
          placeholder="Mot de passe pour suppression"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <ActionButton
          title="Supprimer le compte"
          onPress={handleDeleteAccount}
          variant="danger"
        />

        <View style={styles.separator} />
        <ActionButton
          title="Se déconnecter"
          onPress={handleLogout}
          variant="secondary"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  email: { textAlign: "center", marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    borderColor: "#ccc",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 16,
  },
});
