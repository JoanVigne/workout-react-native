import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function MorpionModal({ visible, onClose, onWin }) {
  const [board, setBoard] = useState(Array(9).fill(null)); // 9 cases
  const [isXNext, setIsXNext] = useState(true); // 'X' pour le joueur, 'O' pour l'ordi
  const [winner, setWinner] = useState(null); // 'X' ou 'O' ou null
  const [gameOver, setGameOver] = useState(false); // Indicateur de fin de jeu

  const checkWinner = (board) => {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let combo of winningCombinations) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]; // 'X' ou 'O'
      }
    }
    return null;
  };

  const handlePress = (index) => {
    if (board[index] || gameOver) return; // Case déjà remplie ou jeu terminé

    const newBoard = [...board];
    newBoard[index] = "X"; // Le joueur humain joue 'X'
    setBoard(newBoard);

    const currentWinner = checkWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
      setGameOver(true); // Le jeu est terminé
      Alert.alert(`${currentWinner} a gagné !`);
      onWin(); // Appeler la fonction `onWin` si le joueur gagne
      return;
    }

    setIsXNext(false); // C'est au tour de l'ordinateur
  };

  const handleComputerMove = () => {
    // L'ordinateur choisit une case vide au hasard
    const emptyIndices = board
      .map((value, index) => (value === null ? index : null))
      .filter((index) => index !== null);
    const randomIndex =
      emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    if (randomIndex === undefined) return; // Si aucune case n'est vide

    const newBoard = [...board];
    newBoard[randomIndex] = "O"; // L'ordinateur joue 'O'
    setBoard(newBoard);

    const currentWinner = checkWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
      setGameOver(true); // Le jeu est terminé
      Alert.alert(`${currentWinner} a gagné !`);
      return;
    }

    setIsXNext(true); // C'est au tour du joueur
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null)); // Réinitialiser le tableau
    setIsXNext(true); // C'est au joueur de commencer
    setWinner(null); // Pas encore de gagnant
    setGameOver(false); // Le jeu n'est pas terminé
  };

  useEffect(() => {
    if (!isXNext && !gameOver) {
      // Si c'est au tour de l'ordinateur, on attend 1s avant de faire le mouvement
      const timer = setTimeout(() => {
        handleComputerMove();
      }, 10);
      return () => clearTimeout(timer); // Nettoyage du timeout
    }
  }, [isXNext, board, gameOver]);

  const renderSquare = (index) => (
    <TouchableOpacity
      key={index}
      style={styles.square}
      onPress={() => handlePress(index)}
    >
      <Text style={styles.squareText}>{board[index]}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Win this game to be able to register</Text>
          <View style={styles.board}>
            {board.map((_, index) => renderSquare(index))}
          </View>

          {/* Le bouton recommencer est visible en tout temps */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={handleRestart}>
              <Text style={styles.restartButton}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
  },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  board: { flexDirection: "row", flexWrap: "wrap", width: 200 },
  square: {
    width: 60,
    height: 60,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  squareText: { fontSize: 30 },
  restartButton: { fontSize: 18, color: "blue", marginTop: 20 },
  buttonsContainer: { flexDirection: "row", marginTop: 20 },
  resultContainer: { marginTop: 20 },
  resultText: { fontSize: 18, fontWeight: "bold" },
});
