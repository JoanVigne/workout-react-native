import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UserProvider } from "./context/UserContext";
import { getApps } from "firebase/app";
import "./firebase"; // Import app to ensure initialization

// Screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import LoadingScreen from "./screens/LoadingScreen";
import WorkoutDetailScreen from "./screens/WorkoutDetailScreen";
import StartWorkoutScreen from "./screens/StartWorkoutScreen";
import SubscriptionScreen from "./screens/SubscriptionScreen";
import TrainingOver from "./screens/TrainingOver";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Inscription" component={RegisterScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
          <Stack.Screen name="StartWorkout" component={StartWorkoutScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="TrainingOver" component={TrainingOver} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
