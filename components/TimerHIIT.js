import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';

const TimerHIIT = forwardRef(({ onComplete }, ref) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('preparation'); // 'preparation', 'work', 'rest'
  const [timeLeft, setTimeLeft] = useState(10); // Commence avec 10s de préparation
  const intervalRef = useRef(null);
  const soundRef = useRef(null);

  const phases = {
    preparation: { duration: 10, next: 'work', color: '#4CAF50', label: 'Préparez-vous' },
    work: { duration: 45, next: 'rest', color: '#f44336', label: 'Travail' },
    rest: { duration: 15, next: 'work', color: '#2196F3', label: 'Repos' }
  };

  useEffect(() => {
    loadSound();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/beep.mp3')
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Erreur chargement son:', error);
    }
  };

  const playSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.error('Erreur lecture son:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    startTimer: (rounds = 8) => {
      setCurrentPhase('preparation');
      setTimeLeft(phases.preparation.duration);
      setIsRunning(true);
      startInterval();
    },
    stopTimer: () => {
      setIsRunning(false);
      clearInterval(intervalRef.current);
    },
    resetTimer: () => {
      setIsRunning(false);
      setCurrentPhase('preparation');
      setTimeLeft(phases.preparation.duration);
      clearInterval(intervalRef.current);
    }
  }));

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          playSound();
          const nextPhase = phases[currentPhase].next;
          setCurrentPhase(nextPhase);
          return phases[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleTimer = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
    } else {
      startInterval();
    }
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.timerCircle, { backgroundColor: phases[currentPhase].color }]}>
        <Text style={styles.phaseText}>{phases[currentPhase].label}</Text>
        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleTimer} style={styles.button}>
          <Ionicons 
            name={isRunning ? 'pause-circle' : 'play-circle'} 
            size={50} 
            color={phases[currentPhase].color} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  phaseText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 10,
  },
});

export default TimerHIIT;
