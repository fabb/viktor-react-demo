import Tone from 'tone'
import { Time, Velocity } from '../../types/timeAndSpace'

export class ViktorTone extends Tone.Monophonic {
    constructor(options: Partial<typeof defaults> = {}) {
        super(options)

        options = Tone.defaultArg(options, defaults)
        // Tone.Monophonic.call(this, options)

        /**
         *  the first voice
         *  @type {Tone.MonoSynth}
         */
        this.voice0 = new Tone.MonoSynth(options.voice0)
        this.voice0.volume.value = -10

        /**
         *  the second voice
         *  @type {Tone.MonoSynth}
         */
        this.voice1 = new Tone.MonoSynth(options.voice1)
        this.voice1.volume.value = -10

        /**
         *  The vibrato LFO.
         *  @type {Tone.LFO}
         *  @private
         */
        this._vibrato = new Tone.LFO(options.vibratoRate, -50, 50)
        this._vibrato.start()

        /**
         * the vibrato frequency
         * @type {Frequency}
         * @signal
         */
        this.vibratoRate = this._vibrato.frequency

        /**
         *  the vibrato gain
         *  @type {Tone.Gain}
         *  @private
         */
        this._vibratoGain = new Tone.Gain(options.vibratoAmount, Tone.Type.Positive)

        /**
         * The amount of vibrato
         * @type {Positive}
         * @signal
         */
        this.vibratoAmount = this._vibratoGain.gain

        /**
         *  the frequency control
         *  @type {Frequency}
         *  @signal
         */
        this.frequency = new Tone.Signal(440, Tone.Type.Frequency)

        /**
         *  Harmonicity is the ratio between the two voices. A harmonicity of
         *  1 is no change. Harmonicity = 2 means a change of an octave.
         *  @type {Positive}
         *  @signal
         *  @example
         * //pitch voice1 an octave below voice0
         * duoSynth.harmonicity.value = 0.5;
         */
        this.harmonicity = new Tone.Multiply(options.harmonicity)
        this.harmonicity.units = Tone.Type.Positive

        //control the two voices frequency
        this.frequency.connect(this.voice0.frequency)
        this.frequency.chain(this.harmonicity, this.voice1.frequency)
        this._vibrato.connect(this._vibratoGain)
        this._vibratoGain.fan(this.voice0.detune, this.voice1.detune)
        this.voice0.connect(this.output)
        this.voice1.connect(this.output)
        this._readOnly(['voice0', 'voice1', 'frequency', 'vibratoAmount', 'vibratoRate'])
    }
}

Tone.extend(ViktorTone, Tone.Monophonic)

/**
 *  @static
 *  @type {Object}
 */
const defaults = Object.freeze({
    vibratoAmount: 0.5,
    vibratoRate: 5,
    harmonicity: 1.5,
    voice0: {
        volume: -10,
        portamento: 0,
        oscillator: {
            type: 'sine',
        },
        filterEnvelope: {
            attack: 0.01,
            decay: 0.0,
            sustain: 1,
            release: 0.5,
        },
        envelope: {
            attack: 0.01,
            decay: 0.0,
            sustain: 1,
            release: 0.5,
        },
    },
    voice1: {
        volume: -10,
        portamento: 0,
        oscillator: {
            type: 'sine',
        },
        filterEnvelope: {
            attack: 0.01,
            decay: 0.0,
            sustain: 1,
            release: 0.5,
        },
        envelope: {
            attack: 0.01,
            decay: 0.0,
            sustain: 1,
            release: 0.5,
        },
    },
})

/**
 *  start the attack portion of the envelopes
 *
 *  @param {Time} [time=now] the time the attack should start
 *  @param {NormalRange} [velocity=1] the velocity of the note (0-1)
 *  @returns {ViktorTone} this
 *  @private
 */
ViktorTone.prototype._triggerEnvelopeAttack = function(time: Time, velocity: Velocity) {
    time = this.toSeconds(time)
    this.voice0._triggerEnvelopeAttack(time, velocity)
    this.voice1._triggerEnvelopeAttack(time, velocity)
    return this
}

/**
 *  start the release portion of the envelopes
 *
 *  @param {Time} [time=now] the time the release should start
 *  @returns {ViktorTone} this
 *  @private
 */
ViktorTone.prototype._triggerEnvelopeRelease = function(time: Time) {
    this.voice0._triggerEnvelopeRelease(time)
    this.voice1._triggerEnvelopeRelease(time)
    return this
}

/**
 *  Get the level of the output at the given time. Measures
 *  the envelope(s) value at the time.
 *  @param {Time} time The time to query the envelope value
 *  @return {NormalRange} The output level between 0-1
 */
ViktorTone.prototype.getLevelAtTime = function(time: Time) {
    return (this.voice0.getLevelAtTime(time) + this.voice1.getLevelAtTime(time)) / 2
}

/**
 *  clean up
 *  @returns {ViktorTone} this
 */
ViktorTone.prototype.dispose = function() {
    Tone.Monophonic.prototype.dispose.call(this)
    this._writable(['voice0', 'voice1', 'frequency', 'vibratoAmount', 'vibratoRate'])
    this.voice0.dispose()
    this.voice0 = null
    this.voice1.dispose()
    this.voice1 = null
    this.frequency.dispose()
    this.frequency = null
    this._vibratoGain.dispose()
    this._vibratoGain = null
    this._vibrato = null
    this.harmonicity.dispose()
    this.harmonicity = null
    this.vibratoAmount.dispose()
    this.vibratoAmount = null
    this.vibratoRate = null
    return this
}