import { Alert } from 'react-native';

// Fonction utilitaire pour gérer les erreurs Firebase
export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error.code, error.message);
  
  // Messages d'erreur par défaut pour chaque catégorie
  const defaultMessages = {
    auth: "Erreur d'authentification",
    storage: "Erreur de stockage",
    firestore: "Erreur de base de données",
    database: "Erreur de base de données",
    unknown: "Une erreur inattendue est survenue"
  };

  // Messages spécifiques pour chaque code d'erreur
  const errorMessages = {
    // Erreurs d'authentification
    'auth/invalid-email': "Format d'email invalide",
    'auth/user-not-found': "Email ou mot de passe incorrect",
    'auth/wrong-password': "Email ou mot de passe incorrect",
    'auth/email-already-in-use': "Cet email est déjà utilisé",
    'auth/weak-password': "Le mot de passe est trop faible",
    'auth/too-many-requests': "Trop de tentatives. Veuillez réessayer plus tard",
    'auth/network-request-failed': "Problème de connexion internet",
    'auth/requires-recent-login': "Veuillez vous reconnecter pour effectuer cette action",
    'auth/user-disabled': "Ce compte a été désactivé",
    'auth/operation-not-allowed': "Opération non autorisée",
    'auth/invalid-credential': "Identifiants invalides",
    
    // Erreurs Firestore
    'firestore/permission-denied': "Vous n'avez pas les permissions nécessaires",
    'firestore/not-found': "Document introuvable",
    'firestore/already-exists': "Ce document existe déjà",
    'firestore/failed-precondition': "Opération impossible dans l'état actuel",
    'firestore/out-of-range': "Valeur hors limites",
    
    // Erreurs Storage
    'storage/object-not-found': "Fichier introuvable",
    'storage/unauthorized': "Accès non autorisé",
    'storage/canceled': "Opération annulée",
    'storage/quota-exceeded': "Quota de stockage dépassé"
  };

  // Déterminer la catégorie d'erreur
  const errorCategory = error.code ? error.code.split('/')[0] : 'unknown';
  
  // Retourner le message spécifique ou le message par défaut de la catégorie
  return {
    message: errorMessages[error.code] || defaultMessages[errorCategory] || defaultMessages.unknown,
    code: error.code,
    category: errorCategory
  };
};

// Fonction pour afficher l'erreur avec Alert
export const showFirebaseError = (error) => {
  const { message, category } = handleFirebaseError(error);
  Alert.alert(
    category === 'unknown' ? "Erreur" : `Erreur ${category}`,
    message
  );
};
