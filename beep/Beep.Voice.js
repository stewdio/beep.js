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

	    var voice = new Beep.Voice()
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

Beep.Voice = function( a, b ){


	//  Remember the ? will be validated by Note()
	//  so it could be an Object, String, Number, etc.
	//
	//      ( AudioContext, Note )
	//      ( AudioContext, ?    )
	//      ( GainNode,     Note )
	//      ( GainNode,     ?    )

	if( a instanceof Beep.AudioContext || a instanceof GainNode ){

		if( a instanceof Beep.AudioContext ){

			this.audioContext = a
			this.destination  = a.destination
		}
		else if( a instanceof GainNode ){

			this.audioContext = a.audioContext
			this.destination  = a
		}
		if( b instanceof Beep.Note ) this.note = b
		else this.note = new Beep.Note( b )//  Still ok if b === undefined.
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

		if( a instanceof Beep.Note ) this.note = a
		else this.note = new Beep.Note( a )//  Still ok if a === undefined.
		if(  b instanceof Beep.AudioContext ){

			this.audioContext = b
			this.destination  = b.destination
		}
		else if( b instanceof GainNode ){

			this.audioContext = b.audioContext
			this.destination  = b
		}
		else {

			this.audioContext = Beep.audioContext
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


	//  Right now these do nothing; just here as a stand-in for the future.

	this.duration = Infinity
	this.attack   = 0
	this.decay    = 0
	this.sustain  = 0


	//  Because of “iOS reasons” we cannot begin playing a sound
	//  until the user has tripped an event.
	//  So we’ll use this boolean to trip this.oscillator.start(0)
	//  on the first use of this Voice instance.

	this.isPlaying = false


	//  Good to know when it’s time to go home.

	this.isDestroyed = false


	//  Push a reference of this instance into BEEP’s library
	//  so we can access and/or destroy it later.

	Beep.voices.push( this )
}




//  Voices are *always* emitting, so “playing” a Note
//  is really a matter of turning its amplitude up.

Beep.Voice.prototype.play = function( params ){


	//  Let’s create that Note.
	//  The params will specify a frequency assignment method to use
	//  otherwise Note() will pick a default.

	if( params !== undefined ) this.note = new Beep.Note( params )
	this.oscillator.frequency.value = this.note.hertz
	this.gainNode.gain.value = this.gainHigh || params.gainHigh || 1


	//  Oh, iOS. This “wait to play” shtick is for you.

	if( this.isPlaying === false ){

		this.isPlaying = true
		this.oscillator.start( 0 )
	}
	return this
}


//  We don’t want to stop() an oscillator because that would destroy it:
//  They are not reusable.
//  Instead we just turn its amplitude down so we can’t hear it.

Beep.Voice.prototype.pause = function(){

	this.gainNode.gain.value = 0
	return this
}


//  Or you know what? Maybe we do want to just kill it.
//  Like sawing off the branch you’re sitting on.

Beep.Voice.prototype.destroy = function(){

	if( this.isDestroyed === false ) {

		if( this.isPlaying ) this.oscillator.stop( 0 )// Stop oscillator after 0 seconds.
		this.oscillator.disconnect()// Disconnect oscillator so it can be picked up by browser’s garbage collector.
		this.isDestroyed = true
	}
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
// 	       new Beep.Voice( this.note.hertz * 3 / 2, this.audioContext )
// 	       .setOscillatorType( 'triangle' )
// 	       .setGainHigh( 0.3 )
//     )
//
//     As for the getters, it just felt rude to create the setters
//    (thereby leading the expectation that getters would also exist)
//     without actually having getters.


Beep.Voice.prototype.getGainHigh = function(){

	return this.gainHigh
}
Beep.Voice.prototype.setGainHigh = function( normalizedNumber ){

	this.gainHigh = normalizedNumber
	return this
}
Beep.Voice.prototype.getOscillatorType = function(){

	return this.oscillator.type
}
Beep.Voice.prototype.setOscillatorType = function( string ){

	this.oscillator.type = string
	return this
}







