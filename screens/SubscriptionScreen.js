import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ActionButton from "../components/ui/ActionButton";

export default function SubscriptionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Abonnements</Text>
      <Text style={styles.description}>
        Choisissez votre plan pour accéder à plus de fonctionnalités
      </Text>
      
      {/* Plans d'abonnement à implémenter */}
      <View style={styles.plansContainer}>
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Plan Gratuit</Text>
          <Text style={styles.planPrice}>0€/mois</Text>
          <Text style={styles.planFeature}>• Fonctionnalités de base</Text>
          <Text style={styles.planFeature}>• 3 workouts max</Text>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Plan Premium</Text>
          <Text style={styles.planPrice}>4.99€/mois</Text>
          <Text style={styles.planFeature}>• Workouts illimités</Text>
          <Text style={styles.planFeature}>• Statistiques avancées</Text>
          <Text style={styles.planFeature}>• Support prioritaire</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  description: {
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 15,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 24,
    color: "#2563EB",
    marginBottom: 15,
  },
  planFeature: {
    marginBottom: 5,
    color: "#4B5563",
  },
});
