// Home.jsx
import React, { useState } from 'react';
import { Chord, Scale, Note } from '@tonaljs/tonal';
import MidiWriter from 'midi-writer-js';

// Get diatonic chords for the scale with correct qualities
function getDiatonicChords(scaleRoot, scaleType) {
  const scale = Scale.get(`${scaleRoot} ${scaleType}`);
  const notes = scale.notes;

  if (!notes.length) return [];

  const triads = scaleType === 'major'
    ? ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
    : ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

  return notes.map((note, i) => Chord.getChord(triads[i], note).symbol);
}

// Afrobeat-style chord progressions (degrees)
function generateAfrobeatsProgression(chords) {
  const afrobeatsProgressions = [
    [1, 5, 6, 4],
    [6, 4, 1, 5],
    [2, 5, 1, 1],
    [1, 4, 5, 4],
    [4, 1, 5, 6],
    [6, 5, 4, 5],
    [1, 6, 4, 5],
  ];

  const template = afrobeatsProgressions[
    Math.floor(Math.random() * afrobeatsProgressions.length)
  ];

  return template.map(degree => chords[degree - 1]);
}

// Invert chord notes by rotating and raising octaves
function invertChord(notes, inversion = 0) {
  const inverted = [...notes];
  for (let i = 0; i < inversion; i++) {
    const note = inverted.shift();
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1), 10);
    inverted.push(noteName + (octave + 1));
  }
  return inverted;
}

// Generate a syncopated melody using pentatonic scale
function generateAfrobeatMelody(scaleRoot, scaleType, numberOfBars = 4) {
  const pentatonicType = scaleType === 'major' ? 'major pentatonic' : 'minor pentatonic';
  const scale = Scale.get(`${scaleRoot} ${pentatonicType}`);
  const notes = scale.notes;
  if (!notes.length) return [];

  const melody = [];

  for (let bar = 0; bar < numberOfBars; bar++) {
    const beats = 4;
    for (let beat = 0; beat < beats * 2; beat++) {
      // Offbeat emphasis, ~60% chance of note
      if (Math.random() < 0.6) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const octave = 5 + Math.floor(Math.random() * 2); // Octave 5 or 6
        melody.push({
          pitch: `${note}${octave}`,
          startTick: bar * 512 + beat * 32 + Math.floor(Math.random() * 10 - 5),
          duration: '8',
          velocity: Math.floor(Math.random() * 30) + 90,
        });
      }
    }
  }

  return melody;
}

export default function Home() {
  const [scaleInput, setScaleInput] = useState("C major");
  const [progression, setProgression] = useState([]);

  const handleGenerateMidi = () => {
    const [rootRaw, typeRaw] = scaleInput.trim().split(" ");
    if (!rootRaw || !typeRaw) {
      alert("Please enter a valid scale, e.g., 'C minor'");
      return;
    }

    const root = Note.simplify(rootRaw);
    const type = typeRaw.toLowerCase();
    const validTypes = ['major', 'minor'];

    if (!validTypes.includes(type)) {
      alert("Scale type must be 'major' or 'minor'");
      return;
    }

    const chordPool = getDiatonicChords(root, type);
    if (!chordPool.length) {
      alert("Could not generate chords for the provided scale.");
      return;
    }

    const chordDegrees = generateAfrobeatsProgression(chordPool);
    setProgression(chordDegrees);

    const track = new MidiWriter.Track();
    track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 })); // Acoustic Grand Piano

    // Add chords
    chordDegrees.forEach((chordSymbol, index) => {
      const chordObj = Chord.get(chordSymbol);
      let notes = chordObj.notes.map(n => n + '4');
      const inversion = Math.floor(Math.random() * 3);
      notes = invertChord(notes, inversion);

      const velocity = Math.floor(Math.random() * 30) + 80;
      const offset = Math.floor(Math.random() * 20) - 10;

      track.addEvent(new MidiWriter.NoteEvent({
        pitch: notes,
        duration: '1',
        startTick: index * 512 + offset,
        velocity,
      }));
    });

    // Add melody
    const melodyNotes = generateAfrobeatMelody(root, type);
    melodyNotes.forEach(note => {
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: [note.pitch],
        duration: note.duration,
        startTick: note.startTick,
        velocity: note.velocity,
      }));
    });

    // Create and download MIDI
    const write = new MidiWriter.Writer(track);
    const blob = new Blob([write.buildFile()], { type: "audio/midi" });

    const filename = `${chordDegrees.join("_")
      .replace(/[#]/g, "sharp")
      .replace(/[\/\\:*?"<>|]/g, '')}.mid`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Afrobeats Chord Progression + Melody MIDI Generator</h2>
      <input
        type="text"
        value={scaleInput}
        onChange={(e) => setScaleInput(e.target.value)}
        placeholder="Enter scale (e.g., C minor, D major)"
        style={{ width: '100%', marginBottom: 10 }}
      />
      <button onClick={handleGenerateMidi} style={{ marginBottom: 10 }}>
        Generate MIDI File
      </button>

      {progression.length > 0 && (
        <div>
          <strong>Generated Progression:</strong>
          <div style={{ marginTop: 5 }}>
            {progression.join(" - ")}
          </div>
        </div>
      )}
    </div>
  );
}
