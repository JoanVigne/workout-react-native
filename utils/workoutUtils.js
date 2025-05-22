import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const getLastWorkouts = async () => {
  try {
    const workoutsRef = collection(db, 'workouts');
    const q = query(workoutsRef, orderBy('lastModified', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    
    const workouts = [];
    querySnapshot.forEach((doc) => {
      workouts.push({ id: doc.id, ...doc.data() });
    });

    return workouts;
  } catch (error) {
    console.error('Erreur lors de la récupération des derniers workouts:', error);
    return [];
  }
};
