import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { addToQueue, getQueue, removeFromQueue } from './offlineQueue';
import NetInfo from '@react-native-community/netinfo';

/**
 * Vérifie si l'appareil est connecté à Internet
 * @returns {Promise<boolean>} true si connecté, false sinon
 */
export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion:', error);
    return false;
  }
};

/**
 * Récupère un document depuis Firestore ou la cache locale
 * @param {string} collection - Nom de la collection
 * @param {string} docId - ID du document
 * @returns {Promise<Object>} Les données du document
 */
export const getDocument = async (collection, docId) => {
  try {
    // Essayer de récupérer depuis Firestore
    const docRef = doc(db, collection, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du document ${collection}/${docId}:`, error);
    throw error;
  }
};

/**
 * Crée ou met à jour un document avec gestion du mode hors ligne
 * @param {string} collection - Nom de la collection
 * @param {string} docId - ID du document
 * @param {Object} data - Données à sauvegarder
 * @param {boolean} merge - Fusionner avec les données existantes (true) ou remplacer (false)
 * @returns {Promise<string>} ID de l'opération ou du document
 */
export const saveDocument = async (collection, docId, data, merge = true) => {
  try {
    const online = await isOnline();
    
    if (online) {
      // En ligne : sauvegarder directement dans Firestore
      const docRef = doc(db, collection, docId);
      
      if (merge) {
        await updateDoc(docRef, data);
      } else {
        await setDoc(docRef, data);
      }
      
      return docId;
    } else {
      // Hors ligne : ajouter à la file d'attente
      return await addToQueue({
        type: merge ? 'update' : 'set',
        collection,
        docId,
        data,
        merge
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du document ${collection}/${docId}:`, error);
    
    // En cas d'erreur, on suppose qu'on est hors ligne et on ajoute à la file d'attente
    return await addToQueue({
      type: merge ? 'update' : 'set',
      collection,
      docId,
      data,
      merge
    });
  }
};

/**
 * Supprime un document avec gestion du mode hors ligne
 * @param {string} collection - Nom de la collection
 * @param {string} docId - ID du document
 * @returns {Promise<string>} ID de l'opération
 */
export const deleteDocument = async (collection, docId) => {
  try {
    const online = await isOnline();
    
    if (online) {
      // En ligne : supprimer directement dans Firestore
      const docRef = doc(db, collection, docId);
      await deleteDoc(docRef);
      return docId;
    } else {
      // Hors ligne : ajouter à la file d'attente
      return await addToQueue({
        type: 'delete',
        collection,
        docId
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du document ${collection}/${docId}:`, error);
    
    // En cas d'erreur, on suppose qu'on est hors ligne et on ajoute à la file d'attente
    return await addToQueue({
      type: 'delete',
      collection,
      docId
    });
  }
};

/**
 * Traite les opérations en attente dans la file
 * @returns {Promise<Array>} Résultats des opérations
 */
export const processQueue = async () => {
  try {
    const online = await isOnline();
    
    if (!online) {
      console.log('Appareil hors ligne, impossible de traiter la file d\'attente');
      return [];
    }
    
    const queue = await getQueue();
    
    if (queue.length === 0) {
      console.log('File d\'attente vide, rien à traiter');
      return [];
    }
    
    console.log(`Traitement de ${queue.length} opérations en attente`);
    
    const results = [];
    
    // Traiter les opérations dans l'ordre (FIFO)
    for (const operation of queue) {
      try {
        const { type, collection, docId, data, merge } = operation;
        const docRef = doc(db, collection, docId);
        
        switch (type) {
          case 'set':
            await setDoc(docRef, data);
            break;
          case 'update':
            await updateDoc(docRef, data);
            break;
          case 'delete':
            await deleteDoc(docRef);
            break;
          default:
            console.warn(`Type d'opération inconnu: ${type}`);
        }
        
        // Supprimer l'opération traitée de la file d'attente
        await removeFromQueue(operation.id);
        
        results.push({
          success: true,
          operation,
          message: `Opération ${type} sur ${collection}/${docId} réussie`
        });
      } catch (error) {
        console.error(`Erreur lors du traitement de l'opération:`, operation, error);
        
        results.push({
          success: false,
          operation,
          error: error.message
        });
        
        // On ne supprime pas l'opération de la file d'attente en cas d'échec
        // Elle sera réessayée lors du prochain appel à processQueue
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erreur lors du traitement de la file d\'attente:', error);
    throw error;
  }
};
