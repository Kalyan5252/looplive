// App.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

export default function LoopStationApp() {
  // App state
  const [tempo, setTempo] = useState(120);
  const [signature, setSignature] = useState('4/4');
  const [showTempoModal, setShowTempoModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Audio state
  const [soundObjects, setSoundObjects] = useState<(Audio.Sound | null)[]>([]);
  const scheduler = useRef<NodeJS.Timeout | null>(null);
  const nextNoteTime = useRef<number>(0);
  const currentBeat = useRef(0);
  const activeSounds = useRef([]);

  // Grid state - 6 rows, 6 columns
  const [activePads, setActivePads] = useState(Array(6).fill(null));
  const [loopSamples, setLoopSamples] = useState(
    Array(6)
      .fill(null)
      .map(() => Array(6).fill(null))
  );

  // Colors for columns
  const columnColors = [
    '#f44336', // Red
    '#2196f3', // Blue
    '#4caf50', // Green
    '#ffeb3b', // Yellow
    '#9c27b0', // Purple
    '#e91e63', // Pink
  ];

  // Initialize Audio
  useEffect(() => {
    async function setupAudio() {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      // Load sample loops (placeholder for actual audio loading)
      // In a real app, you'd have actual sound files in your assets
      const dummySamples = Array(6)
        .fill(null)
        .map((_, rowIdx) =>
          Array(6)
            .fill(null)
            .map((_, colIdx) => ({
              name: `Loop R${rowIdx + 1}C${colIdx + 1}`,
              file: null, // Would be a reference to an actual audio file
              isLoaded: false,
            }))
        );

      setLoopSamples(dummySamples);

      // Set up beat tracking
      startScheduler();
    }

    setupAudio();

    return () => {
      // Clean up
      if (scheduler.current) clearInterval(scheduler.current);

      // Unload all sounds
      soundObjects.forEach(async (sound) => {
        if (sound) {
          await sound.unloadAsync();
        }
      });
    };
  }, []);

  // Start the beat scheduler
  const startScheduler = () => {
    const lookAhead = 25.0; // How frequently to call scheduling function (in milliseconds)

    // Start with the current time
    nextNoteTime.current = Date.now() / 1000;

    // Set up the scheduler interval
    // scheduler.current = setInterval(scheduleBeats, lookAhead);
    scheduler.current = setInterval(
      scheduleBeats,
      lookAhead
    ) as unknown as NodeJS.Timeout;
  };

  // Schedule beats to be played
  const scheduleBeats = () => {
    const secondsPerBeat = 60.0 / tempo;
    const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)
    const currentTime = Date.now() / 1000;

    while (nextNoteTime.current < currentTime + scheduleAheadTime) {
      // Handle beats
      if (currentBeat.current === 0) {
        // At the start of each measure, check for any pad changes
        activePads.forEach(async (columnIndex, rowIndex) => {
          if (columnIndex !== null) {
            // Here you would trigger the actual sample playback
            console.log(
              `Playing loop at row ${rowIndex + 1}, column ${columnIndex + 1}`
            );

            // If we had loaded sound objects, we'd play them here
            // playLoop(rowIndex, columnIndex);
          }
        });
      }

      // Advance beat counter based on time signature
      currentBeat.current = (currentBeat.current + 1) % getBeatCount(signature);

      // Advance time
      nextNoteTime.current += secondsPerBeat;
    }
  };

  // Play a loop (placeholder for actual audio implementation)
  const playLoop = async (rowIndex: number, columnIndex: number) => {
    // In a real implementation, you would:
    // 1. Stop any currently playing loop in this row
    // 2. Start the new loop
    // 3. Keep track of the sound object for later control

    // Just placeholder logic for now
    console.log(`Playing loop from row ${rowIndex}, column ${columnIndex}`);
  };

  // Helper to determine beat count from time signature
  const getBeatCount = (sig: string) => {
    const [numerator] = sig.split('/').map(Number);
    return numerator;
  };

  // Handle pad press
  const handlePadPress = (rowIndex: number, columnIndex: number) => {
    setActivePads((prev) => {
      const newActivePads = [...prev];

      // If this pad is already active, deactivate it
      if (newActivePads[rowIndex] === columnIndex) {
        newActivePads[rowIndex] = null;
      }
      // Otherwise, set this pad as active for this row
      else {
        newActivePads[rowIndex] = columnIndex;
      }

      return newActivePads;
    });
  };

  // Render a single pad
  const renderPad = (rowIndex: number, columnIndex: number) => {
    const isActive = activePads[rowIndex] === columnIndex;
    const baseColor = columnColors[columnIndex];

    return (
      <TouchableOpacity
        key={`${rowIndex}-${columnIndex}`}
        style={[
          styles.pad,
          { backgroundColor: baseColor },
          isActive && styles.activePad,
        ]}
        onPress={() => handlePadPress(rowIndex, columnIndex)}
      >
        <Text style={styles.padText}>
          {loopSamples[rowIndex][columnIndex]?.name ||
            `R${rowIndex + 1}C${columnIndex + 1}`}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render the 6x6 grid
  const renderGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {Array(6)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {Array(6)
                .fill(null)
                .map((_, columnIndex) => renderPad(rowIndex, columnIndex))}
            </View>
          ))}
      </View>
    );
  };

  // Render Tempo Modal
  const renderTempoModal = () => {
    return (
      <Modal visible={showTempoModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Tempo</Text>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={40}
                maximumValue={200}
                step={1}
                value={tempo}
                onValueChange={setTempo}
                minimumTrackTintColor="#2196f3"
                maximumTrackTintColor="#000000"
              />
              <Text style={styles.sliderValue}>{tempo} BPM</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTempoModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setShowTempoModal(false)}
              >
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Signature Modal
  const renderSignatureModal = () => {
    const signatures = ['2/4', '3/4', '4/4', '6/8', '7/8', '5/4'];

    return (
      <Modal
        visible={showSignatureModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Time Signature</Text>

            <View style={styles.signatureGrid}>
              {signatures.map((sig) => (
                <TouchableOpacity
                  key={sig}
                  style={[
                    styles.signatureButton,
                    signature === sig && styles.activeSignature,
                  ]}
                  onPress={() => setSignature(sig)}
                >
                  <Text style={styles.buttonText}>{sig}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSignatureModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setShowSignatureModal(false)}
              >
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.menuButton}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </View>

        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowTempoModal(true)}
          >
            <Text style={styles.controlText}>Tempo: {tempo} BPM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSignatureModal(true)}
          >
            <Text style={styles.controlText}>Signature: {signature}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsButton}>
          <Text style={styles.settingsText}>⚙️</Text>
        </View>
      </View>

      {/* Loop Grid */}
      {renderGrid()}

      {/* Modals */}
      {renderTempoModal()}
      {renderSignatureModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 15,
  },
  menuButton: {
    width: 30,
    justifyContent: 'center',
  },
  hamburgerLine: {
    width: 20,
    height: 0.5,
    backgroundColor: 'white',
    marginVertical: 2,
  },
  headerControls: {
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  controlText: {
    color: 'white',
    fontSize: 16,
  },
  settingsButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    fontSize: 16,
  },
  gridContainer: {
    flex: 1,
    padding: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
  },
  pad: {
    flex: 1,
    margin: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  activePad: {
    opacity: 1,
    borderWidth: 2,
    borderColor: 'white',
    transform: [{ scale: 0.95 }],
  },
  padText: {
    color: 'white',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  sliderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: '40%',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  confirmButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  signatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signatureButton: {
    backgroundColor: '#555',
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 5,
  },
  activeSignature: {
    backgroundColor: '#2196f3',
  },
});
