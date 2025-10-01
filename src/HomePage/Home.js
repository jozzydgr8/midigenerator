// Home.jsx
import React, { useState } from 'react';
import { Chord, Scale, Note } from '@tonaljs/tonal';
import MidiWriter from 'midi-writer-js';

// Get diatonic chords for the scale with correct qualities
function getDiatonicChords(scaleRoot, scaleType) {
  const scale = Scale.get(`${scaleRoot} ${scaleType}`);
  const notes = scale.notes;

  if (!notes.length) return [];

  // Basic triads for major/minor scales
  const triads = scaleType === 'major'
    ? ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
    : ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

  return notes.map((note, i) => Chord.getChord(triads[i], note).symbol);
}

// Afrobeat-style chord progressions (degrees)
function generateAfrobeatsProgression(chords) {
  const afrobeatsProgressions = [
    [1, 5, 6, 4], // I–V–vi–IV
    [6, 4, 1, 5], // vi–IV–I–V
    [2, 5, 1, 1], // ii–V–I–I
    [1, 4, 5, 4], // I–IV–V–IV
    [4, 1, 5, 6], // IV–I–V–vi
    [6, 5, 4, 5], // vi–V–IV–V
    [1, 6, 4, 5], // I–vi–IV–V
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

    // Build chord pool with correct qualities
    const chordPool = getDiatonicChords(root, type);
    if (!chordPool.length) {
      alert("Could not generate chords for the provided scale.");
      return;
    }

    // Generate progression using chord pool (diatonic chords)
    const chordDegrees = generateAfrobeatsProgression(chordPool);

    // Set chord symbols for display
    setProgression(chordDegrees);

    // Create MIDI track and set instrument (Acoustic Grand Piano)
    const track = new MidiWriter.Track();
    track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));

    chordDegrees.forEach((chordSymbol, index) => {
      const chordObj = Chord.get(chordSymbol);
      let notes = chordObj.notes.map(n => n + '4'); // octave 4 base

      // Random inversion 0-2
      const inversion = Math.floor(Math.random() * 3);
      notes = invertChord(notes, inversion);

      // Velocity variation for realism
      const velocity = Math.floor(Math.random() * 30) + 80;

      // Timing offset ±10 ticks for humanization
      const offset = Math.floor(Math.random() * 20) - 10;

      track.addEvent(new MidiWriter.NoteEvent({
        pitch: notes,
        duration: '1', // whole note
        startTick: index * 512 + offset,
        velocity,
      }));
    });

    // Write MIDI file and trigger download
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
      <h2>Afrobeats Chord Progression MIDI Generator (Realistic)</h2>
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
