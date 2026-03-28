export class SoundscapeManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        
        // Thrust state
        this.thrustOsc = null;
        this.thrustGain = null;
        this.isThrusting = false;

        // Panic timer state
        this.timerInterval = null;
        this.timeRemaining = 0;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Setup persistent thrust drone
        this.thrustOsc = this.ctx.createOscillator();
        this.thrustOsc.type = 'sawtooth';
        this.thrustOsc.frequency.value = 40; // Low rumble
        
        this.thrustGain = this.ctx.createGain();
        this.thrustGain.gain.value = 0; // muted by default
        
        // Lowpass filter for the thrust to muffle it
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        this.thrustOsc.connect(filter);
        filter.connect(this.thrustGain);
        this.thrustGain.connect(this.masterGain);
        this.thrustOsc.start();
    }

    setThrusting(thrusting) {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            // Need user interaction to resume, we will just fail silently until they click if it's suspended
            this.ctx.resume().catch(()=> {}); 
        }

        if (this.isThrusting === thrusting) return;
        this.isThrusting = thrusting;
        
        try {
            // Glide the volume
            const now = this.ctx.currentTime;
            this.thrustGain.gain.cancelScheduledValues(now);
            if (thrusting) {
                this.thrustGain.gain.setTargetAtTime(0.5, now, 0.1);
            } else {
                this.thrustGain.gain.setTargetAtTime(0, now, 0.1);
            }
        } catch (e) {
            console.warn("AudioContext error", e);
        }
    }

    playBounce(velocity) {
        if (!this.ctx) this.init();
        
        // Map velocity (approx 0 to 1000) to pitch and volume
        const mag = Math.min(velocity, 1000);
        if (mag < 50) return; // Ignore very soft bumps

        try {
            const vol = (mag / 1000) * 0.8;
            const freq = 100 + (mag / 1000) * 400; // Metallic pitch based on speed

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            // Quick metallic pitch drop
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {}
    }

    playLaser() {
        if (!this.ctx) this.init();

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        } catch(e) {}
    }

    playExplosion() {
        if (!this.ctx) this.init();

        try {
            // White noise for explosion
            const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            // Crunch filter
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start();
        } catch(e) {}
    }

    startPanicTimer(timeRemaining) {
        if (!this.ctx) this.init();
        this.stopPanicTimer();
        this.timeRemaining = timeRemaining;
        this.scheduleTick();
    }

    updatePanicTempo(timeRemaining) {
        this.timeRemaining = timeRemaining;
    }

    stopPanicTimer() {
        if (this.timerInterval) {
            clearTimeout(this.timerInterval);
            this.timerInterval = null;
        }
    }

    scheduleTick() {
        let delay = Math.max(150, (this.timeRemaining / 20) * 1000); 
        if (this.timeRemaining <= 0) return;

        this.playTick();

        this.timerInterval = setTimeout(() => {
            if (this.timeRemaining > 0) {
                this.scheduleTick();
            }
        }, delay);
    }

    playTick() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Higher pitch as time runs out
            const freq = 400 + (20 - this.timeRemaining) * 30;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch(e) {}
    }
}

export const Soundscape = new SoundscapeManager();
