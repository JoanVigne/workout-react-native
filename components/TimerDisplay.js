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
    // Permet uniquement les chiffres et les ":"
    const cleaned = text.replace(/[^\d:]/g, '');
    
    if (cleaned.includes(':')) {
      // Format MM:SS
      const [minutes, seconds] = cleaned.split(':');
      if (minutes && seconds) {
        const mins = parseInt(minutes.slice(-2));
        const secs = parseInt(seconds.slice(-2));
        if (!isNaN(mins) && !isNaN(secs) && secs < 60) {
          return (mins * 60 + secs).toString();
        }
      }
    } else {
      // Format direct en secondes ou MMSS
      const numbers = cleaned.replace(/[^0-9]/g, '');
      if (numbers.length <= 2) {
        // Considéré comme secondes
        return numbers;
      } else if (numbers.length <= 4) {
        // Format MMSS
        const mins = parseInt(numbers.slice(0, -2));
        const secs = parseInt(numbers.slice(-2));
        if (secs < 60) {
          return (mins * 60 + secs).toString();
        }
      }
    }
    return timeLeft; // Garde l'ancienne valeur si invalide
  };

  const handleTimeInput = (text) => {
    setInputValue(text);
    const newTime = parseTimeInput(text);
    if (newTime !== timeLeft) {
      setTimeLeft(newTime);
    }
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
    setTimeLeft('');
    setIsRunning(false);
    setIsEditing(true);
  };

  const toggleTimer = () => {
    if (timeLeft && parseInt(timeLeft) > 0) {
      setIsEditing(false);
      setIsRunning(!isRunning);
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
    if (isRunning && parseInt(timeLeft) > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = parseInt(prev) - 1;
          
          // Son de compte à rebours sans vibration
          if (countdownSoundEnabled && newTime <= 3 && newTime > 0) {
            playSound('SELECT', 0.1, false); // Volume réduit à 10%
          }
          
          if (newTime <= 0) {
            setIsRunning(false);
            setIsEditing(true);
            playSound(); // Son final avec vibration
            if (props.onTimerComplete) {
              props.onTimerComplete();
            }
            return '0';
          }
          return newTime.toString();
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, countdownSoundEnabled]);

  const renderDisplay = () => {
    if (isEditing) {
      return (
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={inputValue || formatTimeString(timeLeft)}
          onChangeText={handleTimeInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="00:00"
          maxLength={5}
          selectTextOnFocus={true}
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
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>

        {renderDisplay()}

        <TouchableOpacity 
          style={styles.playButton}
          onPress={toggleTimer}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={20} 
            color={isRunning ? "#FF6B6B" : "#4CAF50"} 
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
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 1,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    fontSize: 58,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
    color: '#333',
    padding: 0,
  },
  timerText: {
    fontSize: 58,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
    color: '#333',
    padding: 0,
  },
  resetButton: {
    marginRight: 10,
    padding: 3,
  },
  playButton: {
    marginLeft: 10,
    padding: 3,
  },
  soundButton: {
    padding: 3,
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
