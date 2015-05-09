/*


	Beep.Voice




	Requires 

	  1  Beep
	  2  Beep.Note
	  3  Beep.Sample

	Description

	  If a Note is merely a mathematical model then Voices are where
	  the rubber meets the road. Voices contain a Note and an oscillator
	  so a Voice is a thing that can actually sing!
	
	  If our Instruments were monophonic then we’d only need one voice
	  that could be re-used to play any Note.
	  But we’re polyphonic -- we can play multiple notes at once!

	  Sending no arguments to a Voice will give you all default params
	  and results in a playable Concert A.

	  The intended use here is to create a Voice, optionally passing it
	  a Note to begin with, and then alter its Note dynamically in a loop.
	  Example: gliding from a Concert A to one octave lower could involve
	  creating a Voice with no Note argument, calling its play() method, 
	  then from within a loop assign the Voice a new progressively lower
	  Note per loop until desired. 

	Example uses

	  voice = new Beep.Voice( 'eb3' )
	  voice.play()
	  setTimeout( function(){ voice.pause() }, 500 )

	  voice = new Beep.Voice( '3E♭' ) //  Equivalent to above.
	    .setOscillatorType( 'square' )//  For that chunky 8-bit sound.
	    .setAttackGain( 0.3 )         //  0 = No gain. 1 = Full gain.
	    .setAttackDuration( 0.08 )    //  Attack ramp up duration in seconds.
	    .setDecayDuration( 0.1 )      //  Decay ramp down duration in seconds.
	    .setSustainGain( 0.6 )        //  Sustain gain level; percent of attackGain.
	    .setSustainDuration( 1 )      //  Sustain duration in seconds -- normally Infinity.
	    .setReleaseDuration( 0.1 )    //  Release ramp down duration in seconds.
	    .play( 0.5 )                  //  Optionally multiply the attack and sustain gains.


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


	//  Now that we have a handle on what the arguments were
	//  we can run a setup() function. Why make that a separate
	//  function? So Beep.Sample can re-use it when it inherits
	//  Voice’s prototypes!

	this.setup()


	//  Push a reference of this instance into Beep’s library
	//  so we can access and/or teardown it later.

	Beep.voices.push( this )
}




Beep.Voice.prototype.setup = function(){


	//  Create a Gain Node
	//  for turning this voice up and down.

	this.gainNode = this.audioContext.createGain()
	this.gainNode.gain.value = 0
	this.gainNode.connect( this.destination )


	/*


	                    D + ADSR Envelope                      

	  ┌───────┬────────┬───────┬─────────────────┬─────────┐   
	  │ Delay │ Attack │ Decay │     Sustain     │ Release │   
	  │                                                    │  ↑
	  │               •••                                  │   
	  │             ••   •••                               │  G
	  │           ••        •••                            │  A
	  │          •             •••••••••••••••••••         │  I
	  │         •                                 •        │  N
	  │        •                                   •••     │   
	  └••••••••────────┴───────┴─────────────────┴────•••••┘   

	                          TIME →                           


	ADSR stands for Attack, Decay, Sustain, and Release. These are all units
	of duration with the exception of Sustain which instead represents gain
	rather than time. That exception can easily become a point of confusion, 
	particularly in this context where you may wish to script the duration of
	Sustain! For that reason I have named these variables rather verbosely.
	Additionally I’ve added a Delay duration. For more useful information see
	http://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope
	
	@@ TO-DO: Support Bezier curves?

	*/
	this.delayDuration   = 0.00
	this.attackGain      = 0.15//  Absolute value between 0 and 1.
	this.attackDuration  = 0.05
	this.decayDuration   = 0.05
	this.sustainGain     = 0.80//  Percetage of attackGain.
	this.sustainDuration = Infinity
	this.releaseDuration = 0.10


	//  Because of “iOS reasons” we cannot begin playing a sound
	//  until the user has tripped an event.
	//  So we’ll use this boolean to trip this.oscillator.start(0)
	//  on the first use of this Voice instance.

	this.isPlaying = false


	//  Create an Oscillator
	//  for generating the sound.

	this.noteEnabled = true
	this.oscillator = this.audioContext.createOscillator()
	this.oscillator.connect( this.gainNode )
	this.oscillator.type = 'sine'
	this.oscillator.frequency.value = this.note.hertz


	//  @@  NEW FEATURE TK SOON ;)

	this.sampleEnabled = false


	//  Good to know when it’s time to go home.

	this.isTorndown = false
}




//  Voices are *always* emitting, so “playing” a Note
//  is really a matter of turning its amplitude up.

Beep.Voice.prototype.play = function( velocity ){

	var 
	that    = this,
	timeNow = this.audioContext.currentTime,
	gainNow = this.gainNode.gain.value


	//  Optionally accept a velocity (expecting a value 0 through 1)
	//  to be multiplied against the attack and sustain gains.

	if( typeof velocity !== 'number' ) velocity = 0.5


	//  Just in case we’ve changed the value of Note
	//  since initialization.

	if( this.noteEnabled ) this.oscillator.frequency.value = this.note.hertz


	//  We might be playing a sample instead of a Note.

	if( this.sampleEnabled ){

		if( this.sampleResetOnPlay ) this.sample.currentTime = 0
		this.sample.play()
	}


	//  Cancel all your plans.
	//  And let’s tween from the current gain value.

	this.gainNode.gain.cancelScheduledValues( timeNow )
	this.gainNode.gain.setValueAtTime( gainNow, timeNow )


	//  Is there a Delay between when we trigger the Voice and when it Attacks?

	if( this.delayDuration ) this.gainNode.gain.setValueAtTime( gainNow, timeNow + this.delayDuration )
	

	//  Now let’s schedule a ramp up to full gain for the Attack
	//  and then down to a Sustain level after the Decay.

	this.gainNode.gain.linearRampToValueAtTime( 

		velocity * this.attackGain, 
		timeNow + this.delayDuration + this.attackDuration
	)
	this.gainNode.gain.linearRampToValueAtTime( 

		velocity * this.attackGain * this.sustainGain, 
		timeNow + this.delayDuration + this.attackDuration + this.decayDuration
	)


	//  Oh, iOS. This “wait to play” shtick is for you.

	if( this.isPlaying === false ){

		this.isPlaying = true
		if( this.noteEnabled ) this.oscillator.start( 0 )
	}


	//  Did we set a duration limit on this	Voice?

	if( this.sustainDuration !== Infinity ) setTimeout( function(){

		that.pause()

	}, timeNow + this.delayDuration + this.attackDuration + this.sustainDuration * 1000 )


	return this
}


//  We don’t want to stop() an oscillator because that would teardown it:
//  They are not reusable.
//  Instead we just turn its amplitude down so we can’t hear it.

Beep.Voice.prototype.pause = function(){

	var timeNow = this.audioContext.currentTime


	//  Cancel all your plans.
	//  And let’s tween from the current gain value.

	this.gainNode.gain.cancelScheduledValues( timeNow )
	this.gainNode.gain.setValueAtTime( this.gainNode.gain.value, timeNow )  


	//  Now let’s schedule a ramp down to zero gain for the Release.
	
	this.gainNode.gain.linearRampToValueAtTime( 0.0001, timeNow + this.releaseDuration )
	//this.gainNode.gain.exponentialRampToValueAtTime( 0.0001, timeNow + this.releaseDuration )
	this.gainNode.gain.setValueAtTime( 0, timeNow + this.releaseDuration + 0.0001 )

	return this
}


//  Or you know what? Maybe we do want to just kill it.
//  Like sawing off the branch you’re sitting on.

Beep.Voice.prototype.teardown = function(){

	if( this.isTorndown === false ){

		if( this.oscillator ){
			if( this.isPlaying ) this.oscillator.stop( 0 )// Stop oscillator after 0 seconds.
			this.oscillator.disconnect()// Disconnect oscillator so it can be picked up by browser’s garbage collector.
		}
		if( this.source ) this.source.disconnect()
		this.isTorndown = true
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
// 	       .setAttackGain( 0.3 )
//     )
//
//     As for the getters, it just felt rude to create the setters
//    (thereby leading the expectation that getters would also exist)
//     without actually having getters.

;[
	'delayDuration',
	'attackGain',
	'attackDuration',
	'decayDuration',
	'sustainGain',
	'sustainDuration',
	'releaseDuration'

].forEach( function( propertyName ){

	var propertyNameCased = propertyName.substr( 0, 1 ).toUpperCase() + propertyName.substr( 1 )
	
	Beep.Voice.prototype[ 'get'+ propertyNameCased ] = function(){

		return this[ propertyName ]
	}
	Beep.Voice.prototype[ 'set'+ propertyNameCased ] = function( x ){

		this[ propertyName ] = x
		return this
	}
})
Beep.Voice.prototype.getOscillatorType = function(){

	return this.oscillator ? this.oscillator.type : undefined
}
Beep.Voice.prototype.setOscillatorType = function( string ){

	if( this.oscillator ) this.oscillator.type = string
	return this
}







