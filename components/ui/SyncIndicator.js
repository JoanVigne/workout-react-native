import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

/**
 * Indicateur compact de l'état de synchronisation pour l'en-tête
 */
const SyncIndicator = () => {
  const { 
    isOnline, 
    pendingOperations, 
    synchronizeQueue, 
    syncInProgress 
  } = useUser();
  
  // Animation pour l'indicateur de synchronisation
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Lancer l'animation de rotation quand la synchronisation est en cours
  useEffect(() => {
    let rotateAnimation;
    
    if (syncInProgress) {
      rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      
      rotateAnimation.start();
    } else {
      rotateAnim.setValue(0);
    }
    
    return () => {
      if (rotateAnimation) {
        rotateAnimation.stop();
      }
    };
  }, [syncInProgress, rotateAnim]);
  
  // Calculer la rotation pour l'animation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Si aucune opération en attente et pas de synchronisation en cours, ne rien afficher
  if (pendingOperations === 0 && !syncInProgress) {
    return null;
  }
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={isOnline && pendingOperations > 0 && !syncInProgress ? synchronizeQueue : null}
      disabled={!isOnline || syncInProgress || pendingOperations === 0}
    >
      {syncInProgress ? (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="sync" size={20} color="#007bff" />
        </Animated.View>
      ) : (
        <View style={styles.badgeContainer}>
          <Ionicons name="cloud-upload" size={20} color="#007bff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingOperations}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SyncIndicator;
