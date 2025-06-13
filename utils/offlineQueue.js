import AsyncStorage from '@react-native-async-storage/async-storage';

// Clé de stockage pour la file d'attente
const QUEUE_STORAGE_KEY = '@workout_app_offline_queue';

/**
 * Ajoute une opération à la file d'attente
 * @param {Object} operation - L'opération à ajouter (type, path, data)
 */
export const addToQueue = async (operation) => {
  try {
    // Récupérer la file d'attente existante
    const queueString = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    const queue = queueString ? JSON.parse(queueString) : [];
    
    // Ajouter l'horodatage à l'opération
    const timestampedOperation = {
      ...operation,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9) // ID unique simple
    };
    
    // Ajouter l'opération à la file d'attente
    queue.push(timestampedOperation);
    
    // Sauvegarder la file d'attente mise à jour
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    
    console.log('Opération ajoutée à la file d\'attente:', timestampedOperation);
    return timestampedOperation.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la file d\'attente:', error);
    throw error;
  }
};

/**
 * Récupère toutes les opérations de la file d'attente
 * @returns {Array} La file d'attente des opérations
 */
export const getQueue = async () => {
  try {
    const queueString = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return queueString ? JSON.parse(queueString) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération de la file d\'attente:', error);
    return [];
  }
};

/**
 * Supprime une opération de la file d'attente
 * @param {string} operationId - L'ID de l'opération à supprimer
 */
export const removeFromQueue = async (operationId) => {
  try {
    const queue = await getQueue();
    const updatedQueue = queue.filter(op => op.id !== operationId);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    console.log('Opération supprimée de la file d\'attente:', operationId);
  } catch (error) {
    console.error('Erreur lors de la suppression de la file d\'attente:', error);
    throw error;
  }
};

/**
 * Vide complètement la file d'attente
 */
export const clearQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    console.log('File d\'attente vidée');
  } catch (error) {
    console.error('Erreur lors du vidage de la file d\'attente:', error);
    throw error;
  }
};
