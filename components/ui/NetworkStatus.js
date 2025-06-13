import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { useUser } from '../../context/UserContext';
import { Ionicons } from '@expo/vector-icons';

/**
 * Composant affichant l'état de la connexion et permettant de synchroniser manuellement
 * Affiche également des informations de débogage sur la source des données
 */
const NetworkStatus = () => {
  const { 
    isOnline, 
    pendingOperations, 
    synchronizeQueue, 
    syncInProgress,
    lastSyncTime,
    workouts
  } = useUser();
  
  // État pour afficher/masquer les informations de débogage
  const [showDetails, setShowDetails] = useState(false);
  const [dataSource, setDataSource] = useState('inconnu');
  
  // Animation pour l'indicateur de synchronisation
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Lancer l'animation de pulsation quand la synchronisation est en cours
  useEffect(() => {
    let pulseAnimation;
    
    if (syncInProgress) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [syncInProgress, pulseAnim]);
  
  // Déterminer la source des données (pour débogage)
  useEffect(() => {
    // Si nous venons de passer en mode hors ligne, les données viennent probablement du stockage local
    if (!isOnline) {
      setDataSource('stockage local');
    }
    // Si nous sommes en ligne et qu'une synchronisation vient de se terminer, les données viennent de Firebase
    else if (lastSyncTime) {
      setDataSource('Firebase (synchronisé)');
    }
  }, [isOnline, lastSyncTime]);
  
  // Pas besoin de la fonction testOfflineMode

  // Formater la date de dernière synchronisation
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Jamais';
    
    try {
      const date = new Date(lastSyncTime);
      return date.toLocaleString('fr-FR', { 
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage de la date:', error);
      return 'Date inconnue';
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.connectionIndicator}
        onPress={() => {
          // Si des opérations sont en attente et qu'on est en ligne, synchroniser
          if (pendingOperations > 0 && isOnline && !syncInProgress) {
            synchronizeQueue();
          }
          // Dans tous les cas, basculer l'affichage des détails
          setShowDetails(!showDetails);
        }}
      >
        {/* Indicateur d'état de connexion */}
        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#28a745' : '#dc3545' }]} />
        
        {/* Texte d'état */}
        <Text style={styles.connectionText}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
          {pendingOperations > 0 && ` • ${pendingOperations} en attente`}
          {syncInProgress && ' • Synchronisation...'}
        </Text>
        
        {/* Icône de synchronisation si nécessaire */}
        {pendingOperations > 0 && isOnline && !syncInProgress && (
          <Ionicons name="sync" size={14} color="#666" style={styles.syncIcon} />
        )}
        
        {/* Animation de synchronisation en cours */}
        {syncInProgress && (
          <Animated.View 
            style={{
              transform: [{ scale: pulseAnim }],
              marginLeft: 5
            }}
          >
            <Ionicons name="sync" size={14} color="#666" />
          </Animated.View>
        )}
      </TouchableOpacity>
      
      {/* Modal de détails */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetails}
        onRequestClose={() => setShowDetails(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDetails(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de synchronisation</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.detailsItem}>
                <Text style={styles.detailsLabel}>Source des données</Text>
                <Text style={styles.detailsValue}>{dataSource}</Text>
              </View>
              
              <View style={styles.detailsItem}>
                <Text style={styles.detailsLabel}>Nombre d'entrainements</Text>
                <Text style={styles.detailsValue}>{workouts?.length || 0}</Text>
              </View>
              
              <View style={styles.detailsItem}>
                <Text style={styles.detailsLabel}>Dernière synchronisation</Text>
                <Text style={styles.detailsValue}>{formatLastSync()}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'flex-start', // Pour qu'il ne prenne pas 100% de la largeur
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
  },
  syncIcon: {
    marginLeft: 5,
  },
  // Styles pour la modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginTop: 10,
  },
  detailsItem: {
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsValue: {
    fontSize: 15,
    color: '#333',
  },
  debugToggle: {
    alignSelf: 'center',
    marginTop: 5,
    padding: 5,
  },
  debugToggleText: {
    color: '#007bff',
    fontSize: 12,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
  }
});

export default NetworkStatus;
