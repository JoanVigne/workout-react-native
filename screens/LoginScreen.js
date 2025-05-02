import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Button,
  ImageBackground,
} from "react-native";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import Spacer from "../components/ui/Spacer";
import ActionButton from "../components/ui/ActionButton";
import InputField from "../components/ui/InputField";
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("✅ Connexion réussie !");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Succès",
        "Un email de réinitialisation a été envoyé à votre adresse."
      );
    } catch (error) {
      Alert.alert("Erreur", "Échec de l'envoi. Vérifiez votre email.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/fond-ecran-1.jpg")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={1}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Pas encore de compte?</Text>

        <ActionButton
          title="Inscription"
          onPress={() => navigation.navigate("Inscription")}
          variant="info"
        />
        <Spacer height={30} />
        <Text style={styles.title}>Welcome back</Text>

        <InputField placeholder="Email" value={email} onChangeText={setEmail} />

        <InputField
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity onPress={handlePasswordReset}>
          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <ActionButton
          title="SE CONNECTER"
          onPress={handleLogin}
          variant="primary"
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  background: {
    flex: 1,
    justifyContent: "center", // centre verticalement le contenu
  },
  title: {
    color: "white",
    fontSize: 24,
    marginTop: 15,
    marginBottom: 20,
    textAlign: "center",
  },

  forgotPassword: {
    fontSize: 12,
    color: "#007bff",
    textAlign: "right",
    marginBottom: 10,
  },
});
