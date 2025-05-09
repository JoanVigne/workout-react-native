import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Vibration,
  Modal,
  ScrollView,
  Pressable,
  Switch
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const TimerDisplay = forwardRef((props, ref) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isTimerMode, setIsTimerMode] = useState(true); // true = compte à rebours, false = chronomètre
  const [isEditing, setIsEditing] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSound, setSelectedSound] = useState('START');
  const [countdownSoundEnabled, setCountdownSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(1.0);
  const [inputValue, setInputValue] = useState('');

  // Liste des sons locaux
  const SOUNDS = {
    ELEVATOR: {
      source: require('../assets/sounds/mixkit-elevator-tone-2863.wav'),
      name: 'Elevator',
      description: 'Son doux d\'ascenseur'
    },
    SELECT: {
      source: require('../assets/sounds/mixkit-interface-option-select-2573.wav'),
      name: 'Select',
      description: 'Son de sélection d\'interface'
    },
    LOCK: {
      source: require('../assets/sounds/mixkit-gaming-lock-2848.wav'),
      name: 'Lock',
      description: 'Son de verrouillage'
    },
    POP: {
      source: require('../assets/sounds/mixkit-message-pop-alert-2354.mp3'),
      name: 'Pop Alert',
      description: 'Son de notification pop'
    },
    START: {
      source: require('../assets/sounds/mixkit-software-interface-start-2574.wav'),
      name: 'Start',
      description: 'Son de démarrage d\'interface'
    },
    LONG_POP: {
      source: require('../assets/sounds/mixkit-long-pop-2358.wav'),
      name: 'Long Pop',
      description: 'Son pop prolongé'
    },
    CORRECT: {
      source: require('../assets/sounds/mixkit-correct-answer-tone-2870.wav'),
      name: 'Correct',
      description: 'Son de bonne réponse'
    },
    RETRO: {
      source: require('../assets/sounds/mixkit-retro-game-notification-212.wav'),
      name: 'Retro',
      description: 'Son de notification rétro'
    },
    REVEAL: {
      source: require('../assets/sounds/mixkit-tile-game-reveal-960.wav'),
      name: 'Reveal',
      description: 'Son de révélation de jeu'
    }
  };

  const formatTimeString = (timeStr) => {
    if (!timeStr) return '00:00';
    const totalSeconds = parseInt(timeStr);
    if (isNaN(totalSeconds)) return '00:00';
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (text) => {
    // Nettoie l'entrée pour ne garder que les chiffres
    const numbers = text.replace(/[^0-9]/g, '');
    
    // Si vide, retourne 0
    if (!numbers) return '0';
    
    // Format automatique selon la longueur
    switch (numbers.length) {
      case 1: // 0-9 secondes
        return numbers;
      case 2: // 00-99 secondes
        return numbers;
      case 3: // 1-9 minutes + 00-99 secondes
        const m3 = numbers[0];
        const s3 = numbers.slice(1);
        if (parseInt(s3) < 60) {
          return (parseInt(m3) * 60 + parseInt(s3)).toString();
        }
        return timeLeft;
      case 4: // 00-99 minutes + 00-99 secondes
        const m4 = numbers.slice(0, 2);
        const s4 = numbers.slice(2);
        if (parseInt(s4) < 60) {
          return (parseInt(m4) * 60 + parseInt(s4)).toString();
        }
        return timeLeft;
      case 5: // 100-999 minutes + 00-99 secondes
        const m5 = numbers.slice(0, 3);
        const s5 = numbers.slice(3);
        if (parseInt(s5) < 60) {
          return (parseInt(m5) * 60 + parseInt(s5)).toString();
        }
        return timeLeft;
      default:
        return timeLeft;
    }
  };

  const handleTimeInput = (text) => {
    // Nettoie l'entrée pour ne garder que les chiffres
    const cleanText = text.replace(/[^0-9]/g, '');
    
    // Format l'affichage pour l'utilisateur
    if (cleanText.length > 2) {
      const minutes = cleanText.slice(0, -2);
      const seconds = cleanText.slice(-2);
      setInputValue(`${minutes}:${seconds}`);
    } else {
      setInputValue(cleanText);
    }
    
    // Met à jour le timer immédiatement
    const newTime = parseTimeInput(cleanText);
    setTimeLeft(newTime);
    setIsTimerMode(true);
  };

  const handleFocus = () => {
    setInputValue(formatTimeString(timeLeft));
  };

  const handleBlur = () => {
    setInputValue('');
  };

  const playSound = async (soundKey = selectedSound, volume = soundVolume, withVibration = true) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        SOUNDS[soundKey].source,
        { shouldPlay: true }
      );
      await sound.setVolumeAsync(volume);
      await sound.playAsync();
      
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.log('Error stopping sound:', error);
        }
      }, 1000);

      if (withVibration) {
        Vibration.vibrate(200);
      }
    } catch (error) {
      console.log('Error playing sound:', error);
      if (withVibration) {
        Vibration.vibrate(200);
      }
    }
  };

  const resetTimer = () => {
    setTimeLeft('0');
    setInputValue('00:00');
    setIsRunning(false);
    setIsEditing(true); // Permettre l'édition après un reset
    setIsTimerMode(true); // Retour au mode timer par défaut
  };

  const toggleTimer = () => {
    // Fermer le clavier si on est en mode édition
    if (isEditing) {
      setIsEditing(false);
    }

    if (isRunning) {
      // Si on fait pause, on garde juste l'état actuel
      setIsRunning(false);
    } else {
      // Si on appuie sur play
      if (!isTimerMode && (timeLeft === '0' || timeLeft === '' || timeLeft === '00:00')) {
        // Déjà en mode chronomètre et timer à 0, on continue en chronomètre
        setTimeLeft('0');
        setIsRunning(true);
        playSound();
      } else if (timeLeft === '0' || timeLeft === '' || timeLeft === '00:00') {
        // Timer à 0 et pas en mode chronomètre, on démarre le chronomètre
        setIsTimerMode(false);
        setTimeLeft('0');
        setIsRunning(true);
        playSound();
      } else {
        // Une valeur est présente, on continue avec le mode actuel
        setIsRunning(true);
        playSound();
      }
    }
  };

  useImperativeHandle(ref, () => ({
    startTimer: (seconds) => {
      setTimeLeft(seconds.toString());
      setIsEditing(false);
      setIsRunning(true);
    }
  }));

  useEffect(() => {
    let interval;
    if (isRunning) {
      if (!isTimerMode) {
        // Mode chronomètre
        interval = setInterval(() => {
          setTimeLeft(prevTime => {
            const currentSeconds = parseInt(prevTime) || 0;
            return (currentSeconds + 1).toString();
          });
        }, 1000);
      } else if (parseInt(timeLeft) > 0) {
        // Mode timer
        interval = setInterval(() => {
          setTimeLeft(prev => {
            const newTime = parseInt(prev) - 1;
            if (newTime <= 0) {
              setIsRunning(false);
              playSound(selectedSound, soundVolume, true);
              if (props.onTimerComplete) {
                props.onTimerComplete();
              }
              return '0';
            }

            // Jouer un son pour les 3 dernières secondes si activé
            if (countdownSoundEnabled && newTime <= 3) {
              playSound('POP', soundVolume * 0.5, false);
            }

            // Vibrer à chaque seconde pendant les 3 dernières secondes
            if (newTime <= 3) {
              Vibration.vibrate(100);
            }

            return newTime.toString();
          });
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, countdownSoundEnabled]);

  const renderDisplay = () => {
    if (isEditing) {
      return (
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={inputValue || formatTimeString(timeLeft)}
          onChangeText={handleTimeInput}
          onFocus={handleFocus}
          placeholder="00:00"
          maxLength={5}
          selectTextOnFocus={true}
          editable={true}
        />
      );
    }
    return <Text style={styles.timerText}>{formatTimeString(timeLeft)}</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="volume-high" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetTimer}
        >
          <Ionicons name="refresh" size={28} color="#34495e" />
        </TouchableOpacity>
        {renderDisplay()}
        <TouchableOpacity 
          style={[styles.playButton, isRunning ? styles.playButtonActive : null]}
          onPress={toggleTimer}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={28} 
            color={isRunning ? "#e74c3c" : "#27ae60"}
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Options sonores</Text>
              <TouchableOpacity 
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.countdownOption}>
              <Text style={styles.countdownText}>Son du compte à rebours (3-2-1)</Text>
              <Switch
                value={countdownSoundEnabled}
                onValueChange={setCountdownSoundEnabled}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={countdownSoundEnabled ? "#4CAF50" : "#f4f3f4"}
              />
            </View>

            <View style={styles.volumeControl}>
              <Text style={styles.volumeText}>Volume du son final</Text>
              <View style={styles.volumeSliderContainer}>
                <Ionicons name="volume-low" size={20} color="#666" />
                <Slider
                  style={styles.volumeSlider}
                  value={soundVolume}
                  onValueChange={setSoundVolume}
                  minimumValue={0.1}
                  maximumValue={1.0}
                  step={0.1}
                  minimumTrackTintColor="#4CAF50"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#4CAF50"
                />
                <Ionicons name="volume-high" size={20} color="#666" />
              </View>
            </View>

            <Text style={styles.soundSectionTitle}>Son final</Text>
            <ScrollView style={styles.soundList}>
              {Object.entries(SOUNDS).map(([key, sound]) => (
                <Pressable
                  key={key}
                  style={[
                    styles.soundOption,
                    selectedSound === key && styles.selectedSound
                  ]}
                  onPress={() => {
                    setSelectedSound(key);
                    playSound(key, soundVolume);
                  }}
                >
                  <View style={styles.soundOptionContent}>
                    <Text style={styles.soundName}>{sound.name}</Text>
                    <Text style={styles.soundDescription}>{sound.description}</Text>
                  </View>
                  {selectedSound === key && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 6,
    paddingVertical: 2,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 12,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    fontFamily: 'System',
    fontSize: 48,
    fontWeight: '600',
    minWidth: 140,
    textAlign: 'center',
    color: '#2c3e50',
    padding: 0,
    letterSpacing: 2,
  },
  timerText: {
    fontFamily: 'System',
    fontSize: 48,
    fontWeight: '600',
    minWidth: 140,
    textAlign: 'center',
    color: '#2c3e50',
    padding: 0,
    letterSpacing: 2,
  },
  resetButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  playButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  playButtonActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#e74c3c',
  },
  soundButton: {
    padding: 4,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  soundList: {
    maxHeight: 400,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  selectedSound: {
    backgroundColor: '#e8f5e9',
  },
  soundOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  soundDescription: {
    fontSize: 14,
    color: '#666',
  },
  countdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 16,
    flex: 1,
    marginRight: 16,
  },
  soundSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  volumeControl: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 16,
  },
  volumeText: {
    fontSize: 16,
    marginBottom: 8,
  },
  volumeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default TimerDisplay;
