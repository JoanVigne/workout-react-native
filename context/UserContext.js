import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { auth as firebaseAuth, db as firebaseDb } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getQueue, processQueue } from "../utils/offlineQueue";
import { isOnline, saveDocument } from "../utils/firebaseService";

// Clés de stockage pour AsyncStorage
const STORAGE_KEYS = {
  USER_DATA: "@workout_app_user_data",
  NICKNAME: "@workout_app_nickname",
  WORKOUTS: "@workout_app_workouts",
  LAST_SYNC: "@workout_app_last_sync"
};

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Fonctions utilitaires pour AsyncStorage
  const saveToStorage = async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving to AsyncStorage (${key}):`, error);
    }
  };

  const loadFromStorage = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error loading from AsyncStorage (${key}):`, error);
      return null;
    }
  };

  // Fonction pour sauvegarder toutes les données utilisateur
  const saveUserData = async () => {
    if (user) {
      await saveToStorage(STORAGE_KEYS.USER_DATA, user);
      await saveToStorage(STORAGE_KEYS.NICKNAME, nickname);
      await saveToStorage(STORAGE_KEYS.WORKOUTS, workouts);
      await saveToStorage(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }
  };
  
  // Fonction pour mettre à jour un workout existant avec support hors ligne
  const updateWorkout = async (workoutId, workoutData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      // S'assurer que l'ID est inclus dans les données et ajouter la date de modification
      const completeWorkoutData = {
        ...workoutData,
        id: workoutId,
        lastModified: new Date().toISOString()
      };

      if (isOnline) {
        // En ligne: mettre à jour directement dans Firestore
        await updateDoc(doc(db, "workouts", user.uid), {
          [workoutId]: completeWorkoutData
        });

        // Mettre à jour l'état local
        setWorkouts(prev => prev.map(w => 
          w.id === workoutId ? completeWorkoutData : w
        ));
        
        console.log("✅ Workout mis à jour dans Firebase");
      } else {
        // Hors ligne: ajouter à la file d'attente
        await addToOfflineQueue({
          type: 'update',
          path: `workouts/${user.uid}`,
          data: { [workoutId]: completeWorkoutData }
        });

        // Mettre à jour l'état local
        setWorkouts(prev => prev.map(w => 
          w.id === workoutId ? completeWorkoutData : w
        ));

        // Mettre à jour le compteur d'opérations en attente
        updatePendingOperationsCount();
        
        console.log("📝 Workout mis à jour localement, en attente de synchronisation");
      }

      // Sauvegarder les données localement
      await saveUserData();

      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du workout:", error);
      return false;
    }
  };
  
  // Fonction pour sauvegarder les performances d'un entraînement avec support hors ligne
  const saveWorkoutPerformance = async (workoutId, performanceData, date) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      // Utiliser la date fournie ou la date du jour
      const perfDate = date || new Date().toISOString().split('T')[0];
      
      // Préparer les données à mettre à jour
      const updateData = {
        [`${workoutId}.perf.${perfDate}`]: performanceData
      };

      // Trouver le workout existant pour le mettre à jour localement
      const existingWorkout = workouts.find(w => w.id === workoutId);
      if (!existingWorkout) throw new Error("Entraînement non trouvé");

      // Créer une copie mise à jour du workout
      const updatedWorkout = {
        ...existingWorkout,
        perf: {
          ...existingWorkout.perf,
          [perfDate]: performanceData
        },
        lastModified: new Date().toISOString()
      };

      if (isOnline) {
        // En ligne: sauvegarder directement dans Firestore
        await updateDoc(doc(db, "workouts", user.uid), updateData);

        // Mettre à jour l'état local
        setWorkouts(prev => prev.map(w => 
          w.id === workoutId ? updatedWorkout : w
        ));
        
        console.log("✅ Performance d'entraînement sauvegardée dans Firebase");
      } else {
        // Hors ligne: ajouter à la file d'attente
        await addToOfflineQueue({
          type: 'update',
          path: `workouts/${user.uid}`,
          data: updateData
        });

        // Mettre à jour l'état local
        setWorkouts(prev => prev.map(w => 
          w.id === workoutId ? updatedWorkout : w
        ));
        
        // Mettre à jour le compteur d'opérations en attente
        updatePendingOperationsCount();
        
        console.log("📝 Performance d'entraînement sauvegardée localement, en attente de synchronisation");
      }

      // Sauvegarder les données localement
      await saveUserData();

      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la performance:", error);
      return false;
    }
  };

  // Fonction pour créer un nouveau workout avec support hors ligne
  const createWorkout = async (workoutId, workoutData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      // Ajouter l'ID au workout
      const completeWorkoutData = {
        ...workoutData,
        id: workoutId
      };

      if (isOnline) {
        // En ligne: sauvegarder directement dans Firestore
        await setDoc(doc(db, "workouts", user.uid), {
          [workoutId]: completeWorkoutData
        }, { merge: true });

        // Mettre à jour l'état local
        setWorkouts(prev => [...prev, completeWorkoutData]);
      } else {
        // Hors ligne: ajouter à la file d'attente
        await addToOfflineQueue({
          type: 'set',
          path: `workouts/${user.uid}`,
          data: { [workoutId]: completeWorkoutData },
          merge: true
        });

        // Mettre à jour l'état local
        setWorkouts(prev => [...prev, completeWorkoutData]);

        // Mettre à jour le compteur d'opérations en attente
        updatePendingOperationsCount();
      }

      // Sauvegarder les données localement
      await saveUserData();

      return true;
    } catch (error) {
      console.error("Erreur lors de la création du workout:", error);
      return false;
    }
  };
  

  
  // Mettre à jour le compteur d'opérations en attente
  const updatePendingOperationsCount = async () => {
    try {
      const queue = await getQueue();
      setPendingOperations(queue.length);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du compteur d'opérations:", error);
    }
  };

  // Fonction pour charger les données utilisateur depuis AsyncStorage
  const loadUserDataLocally = async (userId) => {
    try {
      console.log(" Tentative de chargement des données depuis le stockage local...");
      const userData = await AsyncStorage.getItem(`@user_data_${userId}`);
      if (userData) {
        const parsedData = JSON.parse(userData);
        setNickname(parsedData.nickname);
        setWorkouts(parsedData.workouts || []);
        setLastSyncTime(parsedData.lastSyncTime);
        
        console.log(" Données chargées depuis le stockage local avec succès!");
        console.log(`   - Nickname: ${parsedData.nickname}`);
        console.log(`   - Nombre de workouts: ${parsedData.workouts?.length || 0}`);
        console.log(`   - Dernière synchronisation: ${parsedData.lastSyncTime ? new Date(parsedData.lastSyncTime).toLocaleString() : 'jamais'}`);        
        return parsedData;
      }
      console.log(" Aucune donnée trouvée dans le stockage local");
      return null;
    } catch (error) {
      console.error(" Erreur lors du chargement des données locales:", error);
      return null;
    }
  };

  // Fonction pour charger les données utilisateur depuis Firestore
  const fetchUserData = async (userId) => {
    try {
      console.log(" Tentative de récupération des données depuis Firebase...");
      // Récupérer le nickname de l'utilisateur
      const userDoc = await getDoc(doc(db, "users", userId));
      const userNickname = userDoc.exists() ? userDoc.data().nickname : null;

      // Récupérer les workouts de l'utilisateur
      const workoutsDoc = await getDoc(doc(db, "workouts", userId));
      const workoutsData = workoutsDoc.exists() ? workoutsDoc.data() : {};

      // Convertir l'objet workouts en tableau
      const workoutsArray = Object.values(workoutsData);

      setNickname(userNickname);
      setWorkouts(workoutsArray);

      console.log(" Données récupérées depuis Firebase avec succès!");
      console.log(`   - Nickname: ${userNickname}`);
      console.log(`   - Nombre de workouts: ${workoutsArray.length}`);

      // Sauvegarder les données dans AsyncStorage
      await saveUserDataLocally(userId, userNickname, workoutsArray);
      console.log(" Données sauvegardées localement");

      return { nickname: userNickname, workouts: workoutsArray };
    } catch (error) {
      console.error(" Erreur lors de la récupération des données depuis Firebase:", error);
      return null;
    }
  };

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

  // Charger les données locales au démarrage
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const storedUser = await loadFromStorage(STORAGE_KEYS.USER_DATA);
        const storedNickname = await loadFromStorage(STORAGE_KEYS.NICKNAME);
        const storedWorkouts = await loadFromStorage(STORAGE_KEYS.WORKOUTS);
        const storedLastSync = await loadFromStorage(STORAGE_KEYS.LAST_SYNC);
        
        if (storedUser) setUser(storedUser);
        if (storedNickname) setNickname(storedNickname);
        if (storedWorkouts) setWorkouts(storedWorkouts);
        if (storedLastSync) setLastSyncTime(storedLastSync);
        
        // Vérifier les opérations en attente
        updatePendingOperationsCount();
      } catch (error) {
        console.error("Error loading local data:", error);
      }
    };
    
    loadLocalData();
  }, []);
  
  // Surveiller l'état de la connexion
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connectionStatus = state.isConnected && state.isInternetReachable;
      setIsOnline(connectionStatus);
      
      // Si on vient de se reconnecter, essayer de traiter la file d'attente
      if (connectionStatus && pendingOperations > 0 && !syncInProgress) {
        synchronizeQueue();
      }
    });
    
    return () => unsubscribe();
  }, [pendingOperations, syncInProgress]);
  
  // Fonction pour synchroniser la file d'attente
  const synchronizeQueue = async () => {
    if (syncInProgress || !isOnline) return;
    
    try {
      console.log(" Début de la synchronisation...");
      setSyncInProgress(true);
      
      const results = await processQueue();
      
      if (results.length > 0) {
        console.log(` Synchronisation terminée: ${results.filter(r => r.success).length}/${results.length} opérations réussies`);
        
        // Mettre à jour le compteur d'opérations en attente
        updatePendingOperationsCount();
        
        // Mettre à jour la date de dernière synchronisation
        const newSyncTime = new Date().toISOString();
        setLastSyncTime(newSyncTime);
        await saveToStorage(STORAGE_KEYS.LAST_SYNC, newSyncTime);
        
        // Si des opérations ont échoué, afficher une alerte
        const failedOps = results.filter(r => !r.success);
        if (failedOps.length > 0) {
          Alert.alert(
            "Synchronisation partielle",
            `${failedOps.length} opération(s) n'ont pas pu être synchronisées et seront réessayées ultérieurement.`,
            [{ text: "OK" }]
          );
        } else if (results.length > 0) {
          // Toutes les opérations ont réussi
          Alert.alert(
            "Synchronisation terminée",
            `${results.length} opération(s) ont été synchronisées avec succès.`,
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      Alert.alert(
        "Erreur de synchronisation",
        "Une erreur est survenue lors de la synchronisation des données.",
        [{ text: "OK" }]
      );
    } finally {
      setSyncInProgress(false);
    }
  };

  // Écouter les changements d'authentification et synchroniser avec Firestore
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userId = firebaseUser.uid;
          let shouldUpdateStorage = false;

          try {
            // Essayer de récupérer les données depuis Firestore
            // nickname
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              setNickname(userDoc.data().nickname);
              shouldUpdateStorage = true;
            }

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
              shouldUpdateStorage = true;
            }
            
            setIsOnline(true);
          } catch (error) {
            console.error("Error fetching from Firestore, using local data:", error);
            setIsOnline(false);
            
            // Afficher une alerte si nous sommes hors ligne
            Alert.alert(
              "Mode hors ligne",
              "Vous êtes actuellement en mode hors ligne. Les données affichées peuvent ne pas être à jour.",
              [{ text: "OK" }]
            );
          } finally {
            // Si nous avons réussi à mettre à jour les données depuis Firestore,
            // sauvegardons-les localement
            if (shouldUpdateStorage) {
              saveUserData();
            }
            setLoading(false);
          }
        } else {
          setUser(null);
          setNickname(null);
          setWorkouts([]);
          
          // Effacer les données locales lors de la déconnexion
          try {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.USER_DATA,
              STORAGE_KEYS.NICKNAME,
              STORAGE_KEYS.WORKOUTS,
              STORAGE_KEYS.LAST_SYNC
            ]);
          } catch (error) {
            console.error("Error clearing local storage:", error);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [auth, db]);
  
  // Sauvegarder les données lorsqu'elles changent
  useEffect(() => {
    if (user) {
      saveUserData();
    }
  }, [workouts, nickname]);

  return (
    <UserContext.Provider
      value={{
        user,
        nickname,
        workouts,
        setWorkouts,
        loading,
        isOnline,
        lastSyncTime,
        saveUserData,
        updateWorkout,
        createWorkout,
        saveWorkoutPerformance,
        pendingOperations,
        synchronizeQueue,
        syncInProgress
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
