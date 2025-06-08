import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { auth as firebaseAuth, db as firebaseDb } from "../firebase";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  // Initialize Firebase services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setAuth(firebaseAuth);
        setDb(firebaseDb);
      } catch (error) {
        console.error("Error initializing Firebase services:", error);
      }
    };
    initializeServices();
  }, []);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userId = firebaseUser.uid;

          // nickname
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) setNickname(userDoc.data().nickname);

          // workouts
          console.log("Fetching workouts for user:", userId);
          const workoutsDoc = await getDoc(doc(db, "workouts", userId));
          console.log("Workouts doc exists:", workoutsDoc.exists());
          if (workoutsDoc.exists()) {
            const data = workoutsDoc.data();
            console.log("Raw workouts data:", data);
            const workoutList = Object.keys(data).map((key) => ({
              id: key,
              name: data[key].name || "Sans nom",
              description: data[key].description || "",
              exercices: data[key].exercices || [],
              perf: data[key].perf || {},
              createdAt: data[key].createdAt,
              lastModified: data[key].lastModified,
            }));
            console.log("Processed workouts:", workoutList);
            setWorkouts(workoutList);
          }
        } else {
          setUser(null);
          setNickname(null);
          setWorkouts([]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [auth, db]);

  return (
    <UserContext.Provider
      value={{ user, nickname, workouts, setWorkouts, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
