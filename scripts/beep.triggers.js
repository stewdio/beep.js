/*


	TRIGGERS





*/




BEEP.Trigger = function( a, b ){

	var that = this


	//  Trigger can accept a few different kinds of input.

	if( a instanceof BEEP.Instrument ){

		this.instrument = a
		if( b instanceof BEEP.Note ) this.note = b
		else if( b !== undefined ) this.note = new BEEP.Note( b )
	}
	else if( a instanceof BEEP.Note ){

		this.note = a
		if( b instanceof BEEP.Instrument ) this.instrument = b
	}
	else if( a !== undefined ){

		this.note = new BEEP.Note( a )
	}
	else this.note = new BEEP.Note()


	//  Just in case we missed these vitals we should make some defaults
	//  which makes it easier to get to Hello World, eh?

	if( this.id === undefined ) this.id = Date.now() +'-'+ Math.round( Math.random() * 10000000000 )


	//  If we have an instrument then we want to re-use
	//  that instrument’s Audio Context.
	//  Afterall, we’re only allowed six of them.

	if( this.instrument ) this.context = this.instrument.context
	else this.context = new BEEP.AudioContext()


	//  Now that we have an Audio Context we should add a buffer of Voices.
	//  Also good to know if our Trigger is engaged or not!
	
	this.engaged = false
	this.voices  = []
	this.createVoices()


	//  Would be good to have an interface, eh?
	//  Something you could keypress or mouseover or touch?

	this.domContainer = document.createElement( 'div' )
	this.domContainer.classList.add( 'trigger' )
	if( this.note.isSharp || this.note.isFlat ) 
		this.domContainer.classList.add( 'unnatural' )
	else this.domContainer.classList.add( 'natural' )


	this.domContainer.classList.add( 'name-index-'+ this.note.nameIndex )
	//this.domContainer.classList.add( 'rainbow' )
	this.domContainer.setAttribute( 'id', 'trigger-'+ this.id )	
	if( this.instrument && this.instrument.domTriggers ) this.instrument.domTriggers.appendChild( this.domContainer )
	else document.body.appendChild( this.domContainer )

	this.domNoteName = document.createElement( 'div' )
	this.domNoteName.classList.add( 'note-name' )
	this.domNoteName.innerHTML = '<strong>'+ this.note.nameSimple +'</strong>'+ this.note.octaveIndex
	this.domContainer.appendChild( this.domNoteName )

	this.domCharsList = document.createElement( 'div' )
	this.domCharsList.classList.add( 'chars-list' )
	this.domContainer.appendChild( this.domCharsList )


	//  Add some mouse and touch events.

	this.eventListeners = []
	this.domContainer.addEventListener( 'mouseenter', function(){ that.engage( 'mouseenter' )})
	this.domContainer.addEventListener( 'mouseleave', function(){ that.disengage( 'mouseenter' )})
	this.domContainer.addEventListener( 'touchstart', function( event ){

		that.engage( 'touched' )
		event.preventDefault()
	})
	this.domContainer.addEventListener( 'touchend', function( event ){

		that.disengage( 'touched' )
		event.preventDefault()
	})
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




//  This is the default play() function.
//  You can easily overwrite this in your own instance of Trigger
//  to use as many or as few voices as you like
//  and with whatever behavior you like.
//  Or even overwrite *all* Triggers at once by overwriting
//  this prototype itself!
// “Down here, it’s our time. It’s our time down here. 
//  That’s all over the second we ride up Troy’s bucket.”

BEEP.Trigger.prototype.createVoices = function(){

	var
	note0, voice0,
	note1, voice1


	//  For our first Voice we don’t need to alter
	//  the note at all.

	note0  = this.note
	voice0 = new BEEP.Voice( note0, this.context )
	voice0.oscillator.type = 'square'
	voice0.gainHigh = 0.2
	this.voices[ 0 ] = voice0


	//  But for our second Voice we do want to alter
	//  the note, and we ought to do that before we
	//  initialize the Voice, otherwise we get some
	//  nice (but unintended) Nintendo explosion sounds.

	note1  = new BEEP.Note( note0.hertz / 2 )
	voice1 = new BEEP.Voice( note1, this.context )
	voice1.oscillator.type = 'sine'
	voice1.gainHigh = 0.3
	this.voices[ 1 ] = voice1


	return this
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







