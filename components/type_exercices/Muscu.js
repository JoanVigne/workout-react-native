import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const Muscu = ({ workout, onWorkoutComplete }) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [sound, setSound] = useState();

    const playSound = async () => {
        const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sounds/beep.mp3')
        );
        setSound(sound);
        await sound.playAsync();
    };

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const startRestTimer = (duration) => {
        setIsResting(true);
        setTimeLeft(duration);
    };

    const handleNextSet = () => {
        if (currentSetIndex < workout.exercises[currentExerciseIndex].sets - 1) {
            setCurrentSetIndex(currentSetIndex + 1);
            startRestTimer(workout.exercises[currentExerciseIndex].rest);
        } else {
            handleNextExercise();
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < workout.exercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setCurrentSetIndex(0);
        } else {
            onWorkoutComplete();
        }
    };

    useEffect(() => {
        let timer;
        if (isResting && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        setIsResting(false);
                        playSound();
                        clearInterval(timer);
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isResting, timeLeft]);

    const currentExercise = workout.exercises[currentExerciseIndex];

    return (
        <View style={styles.container}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.exerciseDetails}>
                {currentExercise.reps} répétitions × {currentExercise.sets} séries
            </Text>
            <Text style={styles.setCounter}>
                Série {currentSetIndex + 1}/{currentExercise.sets}
            </Text>

            {isResting ? (
                <View style={styles.restContainer}>
                    <Text style={styles.restText}>Repos</Text>
                    <Text style={styles.timer}>{timeLeft}s</Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNextSet}
                >
                    <Text style={styles.nextButtonText}>Série terminée</Text>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>
            )}

            <Text style={styles.nextExercise}>
                Prochain exercice: 
                {currentExerciseIndex < workout.exercises.length - 1
                    ? workout.exercises[currentExerciseIndex + 1].name
                    : 'Fin de l\'entraînement'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    exerciseName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    exerciseDetails: {
        fontSize: 18,
        marginBottom: 20,
        color: '#666'
    },
    setCounter: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 30
    },
    restContainer: {
        alignItems: 'center',
        marginVertical: 20
    },
    restText: {
        fontSize: 20,
        color: '#666',
        marginBottom: 10
    },
    timer: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FF6B6B'
    },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 20
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        marginRight: 10
    },
    nextExercise: {
        fontSize: 16,
        color: '#666',
        marginTop: 20,
        textAlign: 'center'
    }
});

export default Muscu;