import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userId = firebaseUser.uid;

        // nickname
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) setNickname(userDoc.data().nickname);

        // workouts
        const workoutsDoc = await getDoc(doc(db, "workouts", userId));
        if (workoutsDoc.exists()) {
          const data = workoutsDoc.data();
          const workoutList = Object.keys(data).map((key) => ({
            id: key,
            name: data[key].name || "Sans nom",
            description: data[key].description || "",
            exercices: data[key].exercices || [],
            perf: data[key].perf || {},
            createdAt: data[key].createdAt,
            lastModified: data[key].lastModified,
          }));
          setWorkouts(workoutList);
        }
      } else {
        setUser(null);
        setNickname(null);
        setWorkouts([]);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider
      value={{ user, nickname, workouts, setWorkouts, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
