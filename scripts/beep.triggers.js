/*


	TRIGGERS

	Instantly add interfaces to your Voices with mouse and keyboard events. 


*/




BEEP.Trigger = function(){

	var that = this


	//  Trigger is rather permissive with its parameters.
	//  You can send it an Instrument, Note, a replacement function
	//  for its createVoices() method, or something that might
	//  possibly be a valid Note if you ran it through Note().
	//  Don’t shoot your eye out, kiddo.

	Array.prototype.slice.call( arguments ).forEach( function( arg ){

		if( arg instanceof BEEP.Instrument ) that.instrument = arg
		else if( arg instanceof Function ) that.createVoices = arg
		else if( arg instanceof BEEP.Note ) that.note = arg
		else that.note = new BEEP.Note( arg )
	})


	//  Might be a grand idea to have a unique ID in case anyone should
	//  need that down the road.

	this.id = Date.now() +'-'+ Math.round( Math.random() * 10000000000 )


	//  If we already have an Instrument then we ought plug into
	//  its existing Audio Context. Otherwise we’ll aim straight for
	//  the “global” BEEP one.

	if( this.instrument ) this.audioContext = this.instrument.audioContext
	else this.audioContext = BEEP.audioContext


	//  What if we didn’t receive anything useful as a Note?
	//  We’ll just run with defaults.

	if( this.note === undefined ) this.note = new BEEP.Note()


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


	//  Push a reference of this instance into BEEP’s library
	//  so we can access and/or destroy it later.

	BEEP.triggers.push( this )
}


BEEP.Trigger.prototype.addEventListener = function( type, action ){

	this.eventListeners.push({

		type: type,
		action: action
	})
	window.addEventListener( type, action )
}
BEEP.Trigger.prototype.removeEventListener = function( type, action ){

	// var i = eventListeners.length - 1

	// for( i = eventListeners.length - 1; i >= 0; i -- ){

	// 	if( eventListeners[ i ].type === type && )
	// }

	window.removeEventListener( type, action )//@@  can we remove this shit from this.eventListeners then???
}



//  You can add as many or as few trigger characters you like.
//  Why would you want to add more? 
//  Try out the default synthesizer and see what happens when
//  you walk the keys up an octave.
//  Is the higher C where you expected it to be?
//  @@ TODO: 
//  Does it make sense to add these listeners to instrument.domContainer instead of window?

BEEP.Trigger.prototype.addTriggerChar = function( trigger ){

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

			if( keyCode === triggerCharCode && !event.metaKey && !event.ctrlKey ) that.engage( 'keydown-'+ triggerCharCode )
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




//  This is the default createVoices() function. You can easily override this 
//  by sending your own Function to the Trigger constructor, or even sending
//  your own Function to Instrument, which will in turn pass it on to each
//  Trigger instance that it builds. 
// “Down here, it’s our time. It’s our time down here. 
//  That’s all over the second we ride up Troy’s bucket.”

BEEP.Trigger.prototype.createVoices = function(){


	//  Let’s call this our “Foundation Voice”
	//  because it will sing the intended Note.

	this.voices.push( 

		new BEEP.Voice( this.note, this.audioContext )
		.setOscillatorType( 'square' )
		.setGainHigh( 0.2 ).setAttack(0.2).setDecay(0.3).setSustain(0.45).setRelease(0.5)
	)


	//  This Voice will sing 1 octave below the Foundation Voice.

	this.voices.push( 

		new BEEP.Voice( this.note.hertz / 2, this.audioContext )
		.setOscillatorType( 'sine' )
		.setGainHigh( 0.3 ).setAttack(0.2).setDecay(0.3).setSustain(0.45).setRelease(0.5)
	)
}


//  All-stop. Kill all the voices (in your head).

BEEP.Trigger.prototype.destroyVoices = function(){

	var i = this.voices.length

	while( i -- ){

		if( this.voices[ i ] !== undefined && typeof this.voices[ i ].pause === 'function' ) this.voices[ i ].pause()
		delete this.voices[ i ]
	}
	this.voices  = []
	this.engaged = false
	return this
}



BEEP.Trigger.prototype.play = function(){

	this.voices.forEach( function( voice ){ voice.play() })
}
BEEP.Trigger.prototype.pause = function(){

	this.voices.forEach( function( voice ){ voice.pause() })
}




//  Engage() and disengage() are like wrappers for 
//  play() and stop() respectively
//  with safety mechanisms and interface feedback.

BEEP.Trigger.prototype.engage = function( eventType ){

	if( this.engaged === false ){

		this.engaged = true
		this.eventType = eventType
		this.domContainer.classList.add( 'engaged' )
		this.play()
	}
	return this
}
BEEP.Trigger.prototype.disengage = function( eventType ){

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

BEEP.Trigger.prototype.destroy = function(){

	this.pause()
	this.eventListeners.forEach( function( event ){

		window.removeEventListener( event.type, event.action )
	})	
	this.eventListeners = []
	this.domContainer.remove()
}







