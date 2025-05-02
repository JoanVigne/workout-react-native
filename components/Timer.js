import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Audio from 'expo-av';

const Timer = forwardRef((props, ref) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeCell, setActiveCell] = useState(null);
  const [sound, setSound] = useState();

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/beep.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useImperativeHandle(ref, () => ({
    startTimer: (exerciseId, setIndex, seconds) => {
      setTimeLeft(Math.round(seconds));
      setActiveCell({ exerciseId, setIndex });
      setIsRunning(true);
    },
    stopTimer: () => {
      setIsRunning(false);
    }
  }));

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            playSound();
            setIsRunning(false);
            if (activeCell && props.onTimerStop) {
              props.onTimerStop(activeCell.exerciseId, activeCell.setIndex);
            }
            setActiveCell(null);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      if (activeCell && props.onTimerStop) {
        props.onTimerStop(activeCell.exerciseId, activeCell.setIndex);
      }
      setActiveCell(null);
    } else if (timeLeft > 0) {
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setActiveCell(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetTimer}
      >
        <Ionicons name="refresh" size={20} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.timerContainer}
        onPress={toggleTimer}
      >
        <Text style={[
          styles.timerText,
          timeLeft <= 10 && isRunning && { color: '#FF6B6B' }
        ]}>
          {formatTime(timeLeft)}
        </Text>
        <Ionicons 
          name={isRunning ? "pause" : "play"} 
          size={20} 
          color={isRunning ? "#FF6B6B" : "#4CAF50"}
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
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
  resetButton: {
    padding: 8,
    marginRight: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 70,
    textAlign: 'center',
  },
});

export default Timer;
