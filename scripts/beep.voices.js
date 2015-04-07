/*


	VOICES

	If a Note is merely a mathematical model then Voices are where
	the rubber meets the road. Voices contain a Note and an oscillator
	so a Voice is a thing that can actually sing!
	
	If our Instruments were monophonic then we’d only need one voice
	that could be re-used to play any Note.
	But we’re polyphonic -- we can play multiple notes at once!

	Sending no arguments to a Voice will give you all default params
	and results in a playable Concert A:

	    var voice = new BEEP.Voice()
	    voice.play()
	    voice.pause()

	The intended use here is to create a Voice, optionally passing it
	a Note to begin with, and then alter its Note dynamically in a loop.
	Example: gliding from a Concert A to one octave lower could involve
	creating a Voice with no Note argument, calling its play() method, 
	then from within a loop assign the Voice a new progressively lower
	Note per loop until desired. 

	new Voice( 'eb3' )


*/




//  We’re expecting up to two kinds of optional arguments: 
//  a note-like thing and an audio-connection-like thing.
//  We can handle several permutations of this.
//  There’s a hardware limitation of 6 Audio Contexts in total
//  so we’d like to connect this Voice to an existing one if 
//  possible. But if need be we can create a new one here.

BEEP.Voice = function( a, b ){


	//  Remember the ? will be validated by Note()
	//  so it could be an Object, String, Number, etc.
	//
	//      ( AudioContext, Note )
	//      ( AudioContext, ?    )
	//      ( GainNode,     Note )
	//      ( GainNode,     ?    )

	if( a instanceof BEEP.AudioContext || a instanceof GainNode ){

		if( a instanceof BEEP.AudioContext ){

			this.audioContext = a
			this.destination  = a.destination
		}
		else if( a instanceof GainNode ){

			this.audioContext = a.audioContext
			this.destination  = a
		}
		if( b instanceof BEEP.Note ) this.note = b
		else this.note = new BEEP.Note( b )//  Still ok if b === undefined.
	}


	//  Again, the ? will be validated by Note()
	//  so it could be an Object, String, Number, etc.
	//
	//      ( Note               )
	//      ( Note, AudioContext )
	//      ( Note, GainNode     )
	//      ( ?                  )
	//      ( ?,    AudioContext )
	//      ( ?,    GainNode     )

	else {

		if( a instanceof BEEP.Note ) this.note = a
		else this.note = new BEEP.Note( a )//  Still ok if a === undefined.
		if(  b instanceof BEEP.AudioContext ){

			this.audioContext = b
			this.destination  = b.destination
		}
		else if( b instanceof GainNode ){

			this.audioContext = b.audioContext
			this.destination  = b
		}
		else {

			this.audioContext = BEEP.audioContext
			this.destination  = this.audioContext.destination
		}
	}


	//  Create a Gain Node
	//  for turning this voice up and down.

	this.gainNode = this.audioContext.createGain()
	this.gainNode.gain.value = 0
	this.gainNode.connect( this.destination )
	this.gainHigh = this.note.gainHigh !== undefined ? this.note.gainHigh : 1


	//  Create an Oscillator
	//  for generating the sound.

	this.oscillator = this.audioContext.createOscillator()
	this.oscillator.connect( this.gainNode )
	this.oscillator.type = 'sine'
	this.oscillator.frequency.value = this.note.hertz

	// A simple attack release implementation. Modify to take Decay and sustain into account.
	// Not sure how duration works. Isnt just sum of Attack Decay Sustain and Release ?

	this.attack   		= 0
	this.release  		= 0.5;
	this.duration 		= Infinity
	this.decay    		= 0.1
	this.decayFraction  = 0.6;
	this.sustain  		= 0.1;


	//  Because of “iOS reasons” we cannot begin playing a sound
	//  until the user has tripped an event.
	//  So we’ll use this boolean to trip this.oscillator.start(0)
	//  on the first use of this Voice instance.

	this.isPlaying = false


	//  Push a reference of this instance into BEEP’s library
	//  so we can access and/or destroy it later.

	BEEP.voices.push( this )
}




//  Voices are *always* emitting, so “playing” a Note
//  is really a matter of turning its amplitude up.

BEEP.Voice.prototype.play = function( params ){


	//  Let’s create that Note.
	//  The params will specify a frequency assignment method to use
	//  otherwise Note() will pick a default.

	if( params !== undefined ) this.note = new BEEP.Note( params )
	this.oscillator.frequency.value = this.note.hertz
	this.gainNode.gain.value = this.gainHigh || params.gainHigh || 1


 	this.adsr(this.gainNode.gain,0.2,0.8);

	//  Oh, iOS. This “wait to play” shtick is for you.

	if( this.isPlaying === false ){

		this.isPlaying = true
		this.oscillator.start( 0 )
	}
	return this
}

BEEP.Voice.prototype.adsr = function (property,attackTime,releaseTime) {

	// Apply ADSR envelope 
	now = this.audioContext.currentTime;
    property.cancelScheduledValues(now);
    property.setValueAtTime(0, now);
    property.linearRampToValueAtTime(1, now + this.attack);
    property.linearRampToValueAtTime(this.decayFraction * 0.6, now + this.attack + this.decay);
    property.linearRampToValueAtTime(0, now + this.attack + this.release + this.sustain + this.decay);
}


//  We don’t want to stop() an oscillator because that would destroy it:
//  They are not reusable.
//  Instead we just turn its amplitude down so we can’t hear it.

BEEP.Voice.prototype.pause = function(){

	this.gainNode.gain.value = 0
	return this
}


//  Or you know what? Maybe we do want to just kill it.
//  Like sawing off the branch you’re sitting on.

BEEP.Voice.prototype.destroy = function(){

	if( this.isPlaying ) this.oscillator.stop( 0 )// Stop oscillator after 0 seconds.
	this.oscillator.disconnect()// Disconnect oscillator so it can be picked up by browser’s garbage collector.
	return this
}




//  Some convenience getters and setters.
//
//  Q: OMG, why? It’s not like we’re protecting private variables.
//     You can already directly access these properties!
//  A: Sure, sure. But by creating setters that return “this”
//     you can easily do function-chaining and never have to create
//     and set temporary variables, like this:
//
//     voices.push( 
//
// 	       new BEEP.Voice( this.note.hertz * 3 / 2, this.audioContext )
// 	       .setOscillatorType( 'triangle' )
// 	       .setGainHigh( 0.3 )
//     )
//
//     As for the getters, it just felt rude to create the setters
//    (thereby leading the expectation that getters would also exist)
//     without actually having getters.


BEEP.Voice.prototype.getGainHigh = function(){

	return this.gainHigh
}
BEEP.Voice.prototype.setGainHigh = function( normalizedNumber ){

	this.gainHigh = normalizedNumber
	return this
}
BEEP.Voice.prototype.getOscillatorType = function(){

	return this.oscillator.type
}
BEEP.Voice.prototype.setOscillatorType = function( string ){

	this.oscillator.type = string
	return this
}

BEEP.Voice.prototype.getAttack = function(){

	return this.attack;
}
BEEP.Voice.prototype.setAttack = function( attack ){

	this.attack = attack;
	return this
}

BEEP.Voice.prototype.getDecay = function(){

	return this.decay;
}

BEEP.Voice.prototype.setDecay = function( decay ){

	this.decay = decay;
	return this
}

BEEP.Voice.prototype.getSustain = function(){

	return this.sustain;
}

BEEP.Voice.prototype.setSustain = function( sustain ){

	this.sustain = sustain;
	return this
}

BEEP.Voice.prototype.setRelease = function(release){

	this.release = release;
	return this;
}

BEEP.Voice.prototype.getRelease = function(){
	return this.release;
}






