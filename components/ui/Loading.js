// components/ui/Loading.js
import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

/**
 * Composant de chargement réutilisable
 * @param {string} size - Taille de l'indicateur (small, large)
 * @param {string} color - Couleur de l'indicateur
 * @param {string} text - Texte à afficher sous l'indicateur
 * @param {object} style - Styles additionnels pour le conteneur
 * @param {object} textStyle - Styles additionnels pour le texte
 */
export default function Loading({ 
  size = "large", 
  color = "#007AFF", 
  text = "Chargement...", 
  style = {},
  textStyle = {}
}) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text ? <Text style={[styles.text, textStyle]}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
  },
});
