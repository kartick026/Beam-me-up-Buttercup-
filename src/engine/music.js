export class MusicSystem {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
        this.currentTrack = null;
        this.volume = 0.3;
        this.nodes = [];
    }

    startMusic() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.playTrack();
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.loopTimeout) clearTimeout(this.loopTimeout);
        this.nodes.forEach(node => {
            try { node.stop(); } catch (e) { }
            try { node.disconnect(); } catch (e) { }
        });
        this.nodes = [];
    }

    playTrack() {
        if (!this.isPlaying) return;

        // Simple procedural techno loop
        const bpm = 120;
        const beatLen = 60 / bpm;
        const barLen = beatLen * 4;

        // Bassline
        this.playSequence([
            { note: 55, time: 0, dur: 0.2 }, // A1
            { note: 55, time: 0.5, dur: 0.2 },
            { note: 55, time: 1.0, dur: 0.2 },
            { note: 58, time: 1.5, dur: 0.2 }, // C2
            { note: 55, time: 2.0, dur: 0.2 },
            { note: 55, time: 2.5, dur: 0.2 },
            { note: 60, time: 3.0, dur: 0.2 }, // D2
            { note: 58, time: 3.5, dur: 0.2 },
        ], beatLen, 'sawtooth', 0.4);

        // Arpeggio
        this.playSequence([
            { note: 440, time: 0, dur: 0.1 }, // A4
            { note: 523, time: 0.25, dur: 0.1 }, // C5
            { note: 659, time: 0.5, dur: 0.1 }, // E5
            { note: 523, time: 0.75, dur: 0.1 },
            { note: 440, time: 1.0, dur: 0.1 },
            { note: 523, time: 1.25, dur: 0.1 },
            { note: 659, time: 1.5, dur: 0.1 },
            { note: 523, time: 1.75, dur: 0.1 },
        ], beatLen, 'square', 0.1);

        // Schedule next loop
        this.loopTimeout = setTimeout(() => {
            if (this.isPlaying) this.playTrack();
        }, barLen * 1000);
    }

    playGameOverTheme() {
        this.stopMusic(); // Stop current track

        const bpm = 60; // Slow tempo
        const beatLen = 60 / bpm;

        // Sad descending melody
        this.playSequence([
            { note: 392.00, time: 0, dur: 0.8 }, // G4
            { note: 369.99, time: 1, dur: 0.8 }, // F#4
            { note: 349.23, time: 2, dur: 0.8 }, // F4
            { note: 329.63, time: 3, dur: 2.0 }, // E4
        ], beatLen, 'triangle', 0.5);

        // Low bass drone
        this.playSequence([
            { note: 98.00, time: 0, dur: 4.0 }, // G2
            { note: 82.41, time: 3, dur: 4.0 }, // E2
        ], beatLen, 'sawtooth', 0.3);
    }

    playSequence(notes, beatLen, type, vol) {
        const now = this.audioCtx.currentTime;

        notes.forEach(n => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(n.note, now + n.time * beatLen);

            gain.gain.setValueAtTime(vol * this.volume, now + n.time * beatLen);
            gain.gain.exponentialRampToValueAtTime(0.01, now + n.time * beatLen + n.dur);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + n.time * beatLen);
            osc.stop(now + n.time * beatLen + n.dur + 0.1);

            this.nodes.push(osc);
            this.nodes.push(gain);
        });

        // Cleanup old nodes
        setTimeout(() => {
            this.nodes = this.nodes.filter(n => {
                // Keep only active nodes? 
                // Actually just clearing the array periodically is safer for memory
                return false;
            });
        }, 5000);
    }
}
