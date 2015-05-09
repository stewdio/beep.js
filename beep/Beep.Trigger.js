/*


	Beep.Trigger




	Requires 

	  1  Beep
	  2  Beep.Note
	  3  Beep.Voice
	  4  Beep.Sample

	Description

	  Instantly add interfaces to your Voices that respond to mouse, 
	  keyboard, and MIDI events. 

	Example uses

	  trigger = new Beep.Trigger()

	Roadmap

	  Add ADSR envelope editing through MIDI.


*/




Beep.Trigger = function(){

	var that = this


	//  Trigger is rather permissive with its parameters.
	//  You can send it an Instrument, Note, a replacement function
	//  for its createVoices() method, or something that might
	//  possibly be a valid Note if you ran it through Note().
	//  Don’t shoot your eye out, kiddo.

	Array.prototype.slice.call( arguments ).forEach( function( arg ){

		if( arg instanceof Beep.Instrument ) that.instrument = arg
		else if( arg instanceof Function ) that.createVoices = arg
		else if( arg instanceof Beep.Note ) that.note = arg
		else that.note = new Beep.Note( arg )
	})


	//  Might be a grand idea to have a unique ID in case anyone should
	//  need that down the road.

	this.id = Date.now() +'-'+ Math.round( Math.random() * 10000000000 )


	//  If we already have an Instrument then we ought plug into
	//  its existing Audio Context. Otherwise we’ll aim straight for
	//  the “global” BEEP one.

	if( this.instrument ) this.audioContext = this.instrument.audioContext
	else this.audioContext = Beep.audioContext


	//  What if we didn’t receive anything useful as a Note?
	//  We’ll just run with defaults.

	if( this.note === undefined ) this.note = new Beep.Note()


	//  Now that we have an Audio Context we should add a buffer of Voices.
	//  Also good to know if our Trigger is engaged or not!
	
	this.engaged = false
	this.voices  = []
	this.createVoices()


	//  This container visually houses the note name
	//  and the visible trigger below it.

	this.domContainer = document.createElement( 'div' )
	this.domContainer.classList.add( 'trigger-container' )
	if( this.note.isSharp || this.note.isFlat ) 
		this.domContainer.classList.add( 'unnatural' )
	else this.domContainer.classList.add( 'natural' )


	//  This is pretty useful for CSS tricks tied to note names (sans octave)
	//  like say... A RAINBOW ROLL !

	this.domContainer.classList.add( 'name-index-'+ this.note.nameIndex )


	//  Who knows, this might be useful in the future.

	this.domContainer.setAttribute( 'id', 'trigger-'+ this.id )	


	//  Every note has a name.
	//  This note’s name is Robert Paulson. 
	//  HIS NAME IS ROBERT PAULSON.

	this.domNoteName = document.createElement( 'div' )
	this.domNoteName.classList.add( 'note-name' )
	this.domNoteName.innerHTML = '<strong>'+ this.note.nameSimple +'</strong>'+ this.note.octaveIndex
	this.domContainer.appendChild( this.domNoteName )


	//  This is the actual visible trigger,
	//  the primary visual element of a keyboard interface.
	//  And the target of our mouse / touch events.

	this.domTrigger = document.createElement( 'div' )
	this.domTrigger.classList.add( 'trigger' )
	this.domContainer.appendChild( this.domTrigger )


	//  This will house a list of all keyboard inputs
	//  that trigger this, uh ... Trigger.

	this.domCharsList = document.createElement( 'div' )
	this.domCharsList.classList.add( 'chars-list' )
	this.domTrigger.appendChild( this.domCharsList )


	//  We’re either attaching all this DOM baggage to
	//  a proper Instrument DOM elment 
	//  or straight to the Document Body element!

	if( this.instrument && this.instrument.domTriggers ) this.instrument.domTriggers.appendChild( this.domContainer )
	else document.body.appendChild( this.domContainer )


	//  Add some mouse and touch events.

	this.eventListeners = []
	this.domTrigger.addEventListener( 'mouseenter', function(){ that.engage( 'mouseenter' )})
	this.domTrigger.addEventListener( 'mouseleave', function(){ that.disengage( 'mouseenter' )})
	this.domTrigger.addEventListener( 'touchstart', function( event ){

		that.engage( 'touched' )
		event.preventDefault()
	})
	this.domTrigger.addEventListener( 'touchend', function( event ){

		that.disengage( 'touched' )
		event.preventDefault()
	})


	//  Add some MIDI events if the browser supports it.
	//  Right now that means Chrome 42 behind a dev flag
	//  and the not-yet-released Chrome 43 proper.

	this.midiNumber = this.note.midiNumber
	if( navigator.requestMIDIAccess ){

		navigator.requestMIDIAccess().then( function( midiAccess ){

			midiAccess.inputs.forEach( function( entry ){

				entry.onmidimessage = that.onMidiMessage.bind( that )
			})
		})
	}


	//  Push a reference of this instance into Beep’s library
	//  so we can access and/or teardown it later.

	Beep.triggers.push( this )
}


Beep.Trigger.prototype.addEventListener = function( type, action ){

	this.eventListeners.push({

		type: type,
		action: action
	})
	window.addEventListener( type, action )
}
Beep.Trigger.prototype.removeEventListener = function( type, action ){

	var i = eventListeners.length - 1

	for( i = eventListeners.length - 1; i >= 0; i -- ){

		if( eventListeners[ i ].type === type &&
			eventListeners[ i ].action === action ){

			eventListeners.splice( i, 1 )
		}
	}
	window.removeEventListener( type, action )
}
Beep.Trigger.prototype.removeEventListeners = function(){

	var eventListener

	while( eventListener = this.eventListeners.pop() ){

		window.removeEventListener( eventListener.type, eventListener.action )
	}
}




//  You can add as many or as few trigger characters you like.
//  Why would you want to add more? 
//  Try out the default synthesizer and see what happens when
//  you walk the keys up an octave.
//  Is the higher C where you expected it to be?

Beep.Trigger.prototype.addTriggerChar = function( trigger ){

	var 
	that = this,
	triggerChar,
	triggerCharCode

	if( typeof trigger === 'string' ){

		triggerChar = trigger.toUpperCase()
		triggerCharCode = triggerChar.charCodeAt( 0 )
		if( triggerChar === '<' ) triggerCharCode = 188// Ad hoc conversion of ASCII to KeyCode.
	}
	else if( typeof trigger === 'number' ){

		triggerCharCode = trigger
		triggerChar = String.fromCharCode( triggerCharCode )
		if( triggerCharCode === 188 ) triggerChar = '<'// Ad hoc conversion of KeyCode to ASCII.
	}
	this.addEventListener(
		
		'keydown', 
		function( event ){

			var keyCode = event.which || event.keyCode

			if( Beep.isKeyboarding && keyCode === triggerCharCode && !event.metaKey && !event.ctrlKey ) that.engage( 'keydown-'+ triggerCharCode )
		}
	)
	this.addEventListener(
		
		'keyup', 
		function( event ){

			var keyCode = event.which || event.keyCode

			if( keyCode === triggerCharCode && !event.metaKey && !event.ctrlKey ) that.disengage( 'keydown-'+ triggerCharCode )
		}
	)
	this.domCharsList.innerHTML += '<br>'+ triggerChar
	return this
}




//  Accept MIDI input as a trigger event.

Beep.Trigger.prototype.onMidiMessage = function( event ){


	//  MIDI data.
	//  
	//  Incoming message bytes are formatted like so: 
	//  
	//  Status  Data1  Data2
	//  0xAB    0xCC   0xDD
	//  
	//     A = Command, range 0–15 (0x0–0xF).
	//     B = Channel, range 0–15 (0x0–0xF).
	//    CC = Note number or item, range 0–255 (0x0–0xFF).
	//    DD = Velcity, range 0–255 (0x0–0xFF).
	//  
	//  For additional information see:
	//  http://en.wikipedia.org/wiki/MIDI
	//  http://www.gweep.net/~prefect/eng/reference/protocol/midispec.html

	var 
	command  = event.data[ 0 ] >> 4, //  Status byte, high nibble.
	channel  = event.data[ 0 ] & 0xF,//  Status byte, low nibble.
	item     = event.data[ 1 ],      //  Data1 byte, often a note number.
	velocity = event.data[ 2 ]       //  Data2 byte, often a velocity.

	if( Beep.verbosity >= 0.7 ){
		
		console.log( '\nMIDI Command', command )
		console.log( 'MIDI Channel', channel )
		console.log( 'MIDI Item', item )
		console.log( 'MIDI Velocity', velocity )
	}
	

	//  Stop!
	//  Either we received a Stop command
	//  or we received a Play command with zero velocity.

	if(( command === 0x8 || ( command === 0x9 && velocity === 0 ))
		&& item === this.midiNumber ){
	
		this.disengage( 'midi' )
	}


	//  Play.

	else if( command === 0x9 && item === this.midiNumber ){

		this.engage( 'midi', velocity / 127 )
	}


	//  Control change.

	else if( command === 0xB ){

		if( item === 1 ){}//  Modulator!
		//@@ TK: Support for ADSR knobs!
	}


	//  Pitch-bend wheel. 
	//   0–63  = bend the pitch down. 
	//  64–128 = bend the pitch up.
	//  Oscillator detuning is done in a unit of “cents.”
	//  There are 1200 cents per 1 octave.
	//  Here we’re allowing the pitch wheel to 
	//  bend down 1 octave or up 1 octave.

	else if( command === 0xE ){
	
		this.voices.forEach( function( voice ){

			if( voice.oscillator ) voice.oscillator.detune.value = ( velocity - 63 ) * 1200 / 63
		})
	}
}




//  This is the default createVoices() function. You can easily override this 
//  by sending your own Function to the Trigger constructor, or even sending
//  your own Function to Instrument, which will in turn pass it on to each
//  Trigger instance that it builds. 
// “Down here, it’s our time. It’s our time down here. 
//  That’s all over the second we ride up Troy’s bucket.”

Beep.Trigger.prototype.createVoices = function(){

	this.voices.push( 


		//  Let’s call this our “Foundation Voice”
		//  because it will sing the intended Note.

		new Beep.Voice( this.note, this.audioContext )
			.setOscillatorType( 'sine' )
			.setAttackGain( 0.2 )
			.setReleaseDuration( 0.2 ),


		//  This Voice will sing 1 octave below the Foundation Voice.

		new Beep.Voice( this.note.hertz / 2, this.audioContext )
			.setOscillatorType( 'square' )
			.setAttackDuration( 0.01 )
			.setAttackGain( 0.3 )
	)
}


//  All-stop. Kill all the voices (in your head).

Beep.Trigger.prototype.teardownVoices = function(){

	var i = this.voices.length

	while( i -- ){

		if( this.voices[ i ] !== undefined ) this.voices[ i ].teardown()
		delete this.voices[ i ]
	}
	this.voices  = []
	this.engaged = false
	return this
}




//  You may be tempted to call play() and pause() directly.
//  Don’t be a fool! Thou shalt instead only call engage()
//  and disengage(). See directly below for details.

Beep.Trigger.prototype.play = function( velocity ){

	this.voices.forEach( function( voice ){ voice.play( velocity ) })
}
Beep.Trigger.prototype.pause = function(){

	this.voices.forEach( function( voice ){ voice.pause() })
}


//  Engage() and disengage() are like wrappers for 
//  play() and pause() respectively
//  with safety mechanisms and interface feedback.

Beep.Trigger.prototype.engage = function( a, b ){

	var eventType, velocity = 1

	if( typeof a === 'string' ) eventType = a
	else if( typeof a === 'number' ) velocity = a
	if( typeof b === 'string' ) eventType = b
	else if( typeof b === 'number' ) velocity = b

	if( this.engaged === false ){

		this.engaged = true
		this.eventType = eventType
		this.domContainer.classList.add( 'engaged' )
		this.play( velocity )
	}
	return this
}
Beep.Trigger.prototype.disengage = function( eventType ){

	if( this.engaged === true && ( this.eventType === eventType || this.eventType === 'code' )){
	
		this.engaged = false		
		this.pause()
		this.domContainer.classList.remove( 'engaged' )
	}
	return this
}




//  If you’re replacing your Instrument’s keyboard
//  it might be useful to dispose of its Triggers in 
//  a meaningful way. 

Beep.Trigger.prototype.teardown = function(){

	this.pause()
	this.teardownVoices()
	this.removeEventListeners()
	this.domContainer.remove()
}







