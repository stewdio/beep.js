/*


	INSTRUMENTS

	synth = new Instrument()
	synth.play( '3C' ).play( '4G' ).play( '5C' )
	synth.pause()

	synth.buildCloseEncounters()


*/




BEEP.Instrument = function( domContainer ){

	var that = this




	Array.prototype.slice.call( arguments ).forEach( function( arg ){

		if( arg instanceof window.Element ) that.domContainer = arg
		else if( typeof arg === 'string' ) that.domContainer = document.getElementById( arg )
		else if( arg instanceof Function ) that.createVoices = arg
	})





	//  Let’s hook up to BEEP’s “global” Audio Context.

	this.context = BEEP.audioContext


	//  Now that we have an Audio Context we can give our Instrument
	//  its own volume knob.
	//  @@  Should add DAT GUI or similiar to control this...

	this.gainNode = this.context.createGain()
	this.gainNode.connect( this.context.destination )
	this.gainNode.gain.value = 0.3


	//  We may have passed in a DOM Element as a target for this Instrument
	//  or a String representing a DOM Element’s ID.
	//  Otherwise we need to build a DOM Element and attach it.

	if( domContainer ){

		if( typeof domContainer === 'string' ) this.domContainer = document.getElementById( domContainer )
		else this.domContainer = domContainer
	}
	else {

		this.domContainer = document.createElement( 'div' )		
		document.body.appendChild( this.domContainer )
	}
	this.domContainer.classList.add( 'instrument' )


	//  What’s an Instrument without an interface?
	//  Let’s add storage for our Triggers.

	this.triggers = {}
	this.domTriggers = document.createElement( 'div' )
	this.domTriggers.classList.add( 'triggers' )
	this.domContainer.appendChild( this.domTriggers )


	//  And we could use a handy interface button
	//  for playing the score we’re going to load.

	var playPauseContainer = document.getElementById( 'play-pause-container' )

	if( !playPauseContainer ) playPauseContainer = this.domContainer
	this.domScorePlayPause = document.createElement( 'div' )
	this.domScorePlayPause.classList.add( 'score-play-pause' )
	playPauseContainer.appendChild( this.domScorePlayPause )
	this.domScorePlayPause.addEventListener( 'click', function(){ that.scoreToggle() })
	this.domScorePlayPause.addEventListener( 'touchend', function( event ){ 

		that.scoreToggle()
		event.preventDefault()
	})


	//  Might be nice if Spacebar can play / pause a score.

	window.addEventListener( 'keypress', function( event ){

		var keyCode = event.which || event.keyCode

		if( keyCode === 32 ){

			that.scoreToggle()
			event.preventDefault()
		}


		//  OMFG this is annoying.
		//  We cannot reliably detect the ESCAPE key here
		//  because of this problem in Chrome: 
		//  https://github.com/philc/vimium/issues/499
		//  Temporarily using SHIFT + ENTER key instead....

		else if( keyCode === 13 && event.shiftKey && that.scoreIsPlaying === false ){

			 if( Object.keys( that.triggers ).length ) that.unbuild()
			 else that.build()
			 event.preventDefault()
		}
	})


	//  Each Trigger will handle its own touch-start and touch-end
	//  but touch-move must be handled by the Trigger’s container.

	this.domContainer.addEventListener( 'touchmove', function( event ){


		//  What are the bounds {X Y W H} of for each touch-move?
		//  Does that intersect with bounds for any of our triggers?
		//  @@  IN THE FUTURE WE’LL ADD EVENT.FORCE :)
		
		Array.prototype.slice.call( event.changedTouches ).forEach( function( touch ){

			Object.keys( that.triggers ).forEach( function( triggerKey ){
				
				var 
				trigger = that.triggers[ triggerKey ],
				rect = trigger.domTrigger.getBoundingClientRect()

				if( rect.left   < touch.pageX &&
					touch.pageX < rect.right   &&
					rect.top    < touch.pageY &&
					touch.pageY < rect.bottom ){

					trigger.engage( 'touched' )
				}
				else trigger.disengage( 'touched' )
			})
		})
		event.preventDefault()
	})
	this.domContainer.addEventListener( 'touchend', function( event ){

		Object.keys( that.triggers ).forEach( function( triggerKey ){

			that.triggers[ triggerKey ].disengage( 'touched' )
		})
	})


	//  Maybe this instrument should play some tunes?
	//  Perhaps makes sense to move all of this into a score.js
	//  rather than have it be a part of Instrument?

	this.bpm            = 140//  Beats per minute.
	this.beatsPerBar    =   4//  Not in use yet.
	this.oneBeat        = 1/4//  Quarter note.
	this.beats          =   0//  Current beat... Maybe change name?
	this.timePrevious   =   0
	this.scoreCompleted =  []
	this.scoreRemaining =  []
	this.scoreIsPlaying = false


	//  We actually have to wait until the last second to build()
	//  because it requires all of the above to be in place first.

	this.build()
}




    //////////////////
   //              //
  //   Triggers   //
 //              //
//////////////////


//  Convenience method for calling new Trigger() that
//  automagically attaches it to this Instrument. 
//  You can of course build your own custom Triggers and 
//  add them manually, give them a custom ID, and so on.

BEEP.Instrument.prototype.newTrigger = function( note, triggerChars ){

	var trigger

	if( note instanceof BEEP.Note === false ) note = new BEEP.Note( note )	
	

	//  Here we’re going to assume if we intentionally sent a createVoices()
	//  function to our Instrument then we’d like all Triggers to use it.
	//  Otherwise you could quite easily send unique functions for creating
	//  voices to each individual Trigger, eh?

	if( this.createVoices !== undefined )
		trigger = new BEEP.Trigger( this, note, this.createVoices )
	else trigger = new BEEP.Trigger( this, note )


	//  What keyboard character or characters should trigger this Trigger?

	if( triggerChars instanceof Array === false ) triggerChars = [ triggerChars ]
	triggerChars.forEach( function( triggerChar ){

		if( triggerChar !== undefined ) trigger.addTriggerChar( triggerChar )
	})


	//  We’ll go with this format for ID’s:
	//  Octave # + Note Name (sans any Natural symbols).

	this.triggers[ note.octaveIndex + note.nameSimple ] = trigger
	return this
}
BEEP.Instrument.prototype.play = function( trigger ){

	var 
	triggersArray  = Object.keys( this.triggers ),
	triggersMiddle = Math.floor( triggersArray.length / 2 )//  Middle C on our standard 2 octave build.

	if( trigger === undefined ) trigger = triggersArray[ triggersMiddle ]
	if( typeof trigger === 'string' && this.triggers[ trigger ]) trigger = this.triggers[ trigger ]
	if( trigger instanceof BEEP.Trigger ) trigger.engage( 'code' )
	return this
}
BEEP.Instrument.prototype.pause = function( trigger ){

	var that = this

	if( typeof trigger === 'string' && this.triggers[ trigger ]) trigger = this.triggers[ trigger ]
	if( trigger instanceof BEEP.Trigger ) trigger.disengage()
	if( trigger === undefined ) Object.keys( this.triggers ).forEach( function( trigger ){

		that.triggers[ trigger ].disengage()//  Kill eveything now regardless of who started it!
	})
	return this
}






    ////////////////
   //            //
  //   Builds   //
 //            //
////////////////


//  Build a fleshed-out (full) two octave keyboard.
//  No frills. Just the goods.

BEEP.Instrument.prototype.buildStandard = function(){

	this.unbuild()
	.newTrigger( '3C' , 'z' )
	.newTrigger( '3C♯', 's' )
	.newTrigger( '3D' , 'x' )
	.newTrigger( '3E♭', 'd' )
	.newTrigger( '3E' , 'c' )
	.newTrigger( '3F' , 'v' )
	.newTrigger( '3F♯', 'g' )
	.newTrigger( '3G' , 'b' )
	.newTrigger( '3A♭', 'h' )
	.newTrigger( '3A' , 'n' )
	.newTrigger( '3B♭', 'j' )
	.newTrigger( '3B' , 'm' )
	.newTrigger( '4C' , [ 'q', '<' ])
	.newTrigger( '4C♯', '2' )
	.newTrigger( '4D' , 'w' )
	.newTrigger( '4E♭', '3' )
	.newTrigger( '4E' , 'e' )
	.newTrigger( '4F' , 'r' )
	.newTrigger( '4F♯', '5' )
	.newTrigger( '4G' , 't' )
	.newTrigger( '4A♭', '6' )
	.newTrigger( '4A' , 'y' )
	.newTrigger( '4B♭', '7' )
	.newTrigger( '4B' , 'u' )
	.newTrigger( '5C' , 'i' )


	//  We’ve loaded a default set of Triggers with this.build()
	//  and now we might as well load a default score
	//  so it’s dead easy to demonstrate how this works.

	this.scoreLoadDoReMi()
	this.scoreLoadFromHash()
	return this
}
BEEP.Instrument.prototype.buildCloseEncounters = function(){

	this.unbuild()
	.newTrigger( '4G', '1' )
	.newTrigger( '4A', '2' )
	.newTrigger( '4F', '3' )
	.newTrigger( '3F', '4' )
	.newTrigger( '4C', '5' )
	return this
}
BEEP.Instrument.prototype.buildCloseEncountersJust = function(){//@@  EVERYTHING IS ONE OCTAVE LOWER THAN SHOULD BE! ASIDE FROM '4A' !!

	this.unbuild()
	.newTrigger( new BEEP.Note.JustIntonation( '4G', '4C' ), '1' )
	.newTrigger( new BEEP.Note.JustIntonation( '4A', '4C' ), '2' )
	.newTrigger( new BEEP.Note.JustIntonation( '4F', '4C' ), '3' )
	.newTrigger( new BEEP.Note.JustIntonation( '3F', '4C' ), '4' )
	.newTrigger( new BEEP.Note.JustIntonation( '4C', '4C' ), '5' )
	return this
}
BEEP.Instrument.prototype.buildJustVsEDO12 = function(){

	this.unbuild()
	.newTrigger( '4C', '1' )
	.newTrigger( '4D', '2' )
	.newTrigger( '4A', '3' )	
	.newTrigger( new BEEP.Note.JustIntonation( '4C', '4C' ), '7' )
	.newTrigger( new BEEP.Note.JustIntonation( '4D', '4C' ), '8' )
	.newTrigger( new BEEP.Note.JustIntonation( '4A', '4C' ), '9' )
	return this
}
BEEP.Instrument.prototype.buildC = function(){

	this.unbuild()
	.newTrigger( '3C', 'z' )
	.newTrigger( '3C♯' )
	.newTrigger( '3D', 'x' )
	.newTrigger( '3E♭' )
	.newTrigger( '3E', 'c' )
	.newTrigger( '3F', 'v' )
	.newTrigger( '3F♯' )
	.newTrigger( '3G', 'b' )
	.newTrigger( '3A♭' )
	.newTrigger( '3A', 'n' )
	.newTrigger( '3B♭' )
	.newTrigger( '3B', 'm' )
	.newTrigger( '4C' , [ 'a', '<' ])
	.newTrigger( '4C♯' )
	.newTrigger( '4D', 's' )
	.newTrigger( '4E♭' )
	.newTrigger( '4E', 'd' )
	.newTrigger( '4F', 'f' )
	.newTrigger( '4F♯' )
	.newTrigger( '4G', 'g' )
	.newTrigger( '4A♭' )
	.newTrigger( '4A', 'h' )
	.newTrigger( '4B♭' )
	.newTrigger( '4B', 'j' )
	.newTrigger( '5C', [ 'k', 'q' ])
	.newTrigger( '5C♯' )
	.newTrigger( '5D', 'w' )
	.newTrigger( '5E♭' )
	.newTrigger( '5E', 'e' )
	.newTrigger( '5F', 'r' )
	.newTrigger( '5F♯' )
	.newTrigger( '5G', 't' )
	.newTrigger( '5A♭' )
	.newTrigger( '5A', 'y' )
	.newTrigger( '5B♭' )
	.newTrigger( '5B', 'u' )
	.newTrigger( '6C', [ 'i', '1' ])
	.newTrigger( '6C♯' )
	.newTrigger( '6D', '2' )
	.newTrigger( '6E♭' )
	.newTrigger( '6E', '3' )
	.newTrigger( '6F', '4' )
	.newTrigger( '6F♯' )
	.newTrigger( '6G', '5' )
	.newTrigger( '6A♭' )
	.newTrigger( '6A', '6' )
	.newTrigger( '6B♭' )
	.newTrigger( '6B', '7' )
	.newTrigger( '7C', '8' )
	.domContainer.classList.add( 'mini' )
	return this
}
BEEP.Instrument.prototype.buildCRainbow = function(){

	this.buildC()
	this.domContainer.classList.add( 'rainbow' )
	this.scoreLoadDoReMi()
	this.scoreLoadFromHash()
	return this
}
BEEP.Instrument.prototype.buildCJust = function(){

	this.unbuild()
	.newTrigger( new BEEP.Note.JustIntonation( '3C' , '4C' ), 'z' )
	.newTrigger( new BEEP.Note.JustIntonation( '3C♯', '4C' ))
	.newTrigger( new BEEP.Note.JustIntonation( '3D' , '4C' ), 'x' )
	.newTrigger( new BEEP.Note.JustIntonation( '3E♭', '4C' ))
	.newTrigger( new BEEP.Note.JustIntonation( '3E' , '4C' ), 'c' )
	.newTrigger( new BEEP.Note.JustIntonation( '3F' , '4C' ), 'v' )
	.newTrigger( new BEEP.Note.JustIntonation( '3F♯', '4C' ))
	.newTrigger( new BEEP.Note.JustIntonation( '3G' , '4C' ), 'b' )
	.newTrigger( new BEEP.Note.JustIntonation( '3A♭', '4C' ))
	.newTrigger( new BEEP.Note.JustIntonation( '3A' , '4C' ), 'n' )
	.newTrigger( new BEEP.Note.JustIntonation( '3B♭', '4C' ))
	.newTrigger( new BEEP.Note.JustIntonation( '3B' , '4C' ), 'm' )
	.newTrigger( new BEEP.Note.JustIntonation( '4C' , '4C' ) , [ 'a', '<' ])
	.newTrigger( new BEEP.Note.JustIntonation( '4C♯', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '4D' , '4C' ), 's' )
	.newTrigger( new BEEP.Note.JustIntonation( '4E♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '4E' , '4C' ), 'd' )
	.newTrigger( new BEEP.Note.JustIntonation( '4F' , '4C' ), 'f' )
	.newTrigger( new BEEP.Note.JustIntonation( '4F♯', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '4G' , '4C' ), 'g' )
	.newTrigger( new BEEP.Note.JustIntonation( '4A♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '4A' , '4C' ), 'h' )
	.newTrigger( new BEEP.Note.JustIntonation( '4B♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '4B' , '4C' ), 'j' )
	.newTrigger( new BEEP.Note.JustIntonation( '5C' , '4C' ), [ 'k', 'q' ])
	.newTrigger( new BEEP.Note.JustIntonation( '5C♯', '4C' ))
	.newTrigger( new BEEP.Note.JustIntonation( '5D' , '4C' ), 'w' )
	.newTrigger( new BEEP.Note.JustIntonation( '5E♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '5E' , '4C' ), 'e' )
	.newTrigger( new BEEP.Note.JustIntonation( '5F' , '4C' ), 'r' )
	.newTrigger( new BEEP.Note.JustIntonation( '5F♯', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '5G' , '4C' ), 't' )
	.newTrigger( new BEEP.Note.JustIntonation( '5A♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '5A' , '4C' ), 'y' )
	.newTrigger( new BEEP.Note.JustIntonation( '5B♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '5B' , '4C' ), 'u' )
	.newTrigger( new BEEP.Note.JustIntonation( '6C' , '4C' ), [ 'i', '1' ])
	.newTrigger( new BEEP.Note.JustIntonation( '6C♯', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '6D' , '4C' ), '2' )
	.newTrigger( new BEEP.Note.JustIntonation( '6E♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '6E' , '4C' ), '3' )
	.newTrigger( new BEEP.Note.JustIntonation( '6F' , '4C' ), '4' )
	.newTrigger( new BEEP.Note.JustIntonation( '6F♯', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '6G' , '4C' ), '5' )
	.newTrigger( new BEEP.Note.JustIntonation( '6A♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '6A' , '4C' ), '6' )
	.newTrigger( new BEEP.Note.JustIntonation( '6B♭', '4C' ) )
	.newTrigger( new BEEP.Note.JustIntonation( '6B' , '4C' ), '7' )
	.newTrigger( new BEEP.Note.JustIntonation( '7C' , '4C' ), '8' )
	.domContainer.classList.add( 'mini' )
	return this
}
BEEP.Instrument.prototype.build = BEEP.Instrument.prototype.buildStandard
BEEP.Instrument.prototype.unbuild = function(){

	var that = this

	Object.keys( this.triggers ).forEach( function( trigger ){

		that.triggers[ trigger ].destroy()
		delete that.triggers[ trigger ]
	})
	this.domContainer.classList.remove( 'mini' )
	this.domContainer.classList.remove( 'rainbow' )
	return this
}




    ///////////////
   //           //
  //   Songs   //
 //           //
///////////////


BEEP.Instrument.prototype.scoreLoadFromHash = function(){

	if( document.location.hash !== '' ){

		var score = document.location.hash.substr( 1 ).split( ',' ).map( function( element ){

			var value

			try {

				value = eval( element )
			}
			catch( error ){}
			return value
		})
		this.scoreUnload()
		this.scoreLoad( score )
	}
}
BEEP.Instrument.prototype.scoreLoad = function( score ){

	var beat = 0, i, note

	for( i = 0; i < score.length; i += 3 ){


		//  This bit here means you can call 'Bb'
		//  and it will still trigger 'B♭', etc!

		note = new BEEP.Note( score[ i+1 ])


		//  TO DO FUTURE @@
		//  Check if this entry is overwriting a call to this same Trigger.
		//  For example a previous entry at this very beat calls the Trigger
		//  to engage, while this current entry calls it to disengage at the
		//  exact same beat. We should nudge the call for engagement one 
		//  loop into to the future!! 

		beat += score[ i+0 ] || 0
		this.scoreRemaining.push([ beat, note.octaveIndex + note.nameSimple, true  ])
		this.scoreRemaining.push([ beat + score[ i+2 ], note.octaveIndex + note.nameSimple, false ])
	}
	this.scoreRemaining.sort( function( a, b ){

		return a[ 0 ] - b[ 0 ]
	})
	return this
}
BEEP.Instrument.prototype.scorePlayLoop = function(){

	var 
	performant = window.performance && window.performance.now,
	now = performant ? performance.now() : Date.now(),
	delta = now - this.timePrevious

	if( this.timePrevious === 0 ) delta = 1
	while( this.scoreRemaining.length && this.beats >= this.scoreRemaining[ 0 ][ 0 ] ){

		if( this.scoreRemaining[ 0 ][ 2 ]) this.play( this.scoreRemaining[ 0 ][ 1 ] )
		else this.pause( this.scoreRemaining[ 0 ][ 1 ] )
		this.scoreCompleted.push( this.scoreRemaining.shift() )
	}
	this.beats += this.bpm / 60 / delta * this.oneBeat
	this.timePrevious = now
	if( this.scoreRemaining.length === 0 ){

		this.scoreIsPlaying = false
		this.scoreRemaining = this.scoreRemaining.concat( this.scoreCompleted )
		this.scoreCompleted = []
		this.beats          = 0
		this.timePrevious   = 0
		this.domScorePlayPause.classList.remove( 'is-playing' )
	}
	if( this.scoreIsPlaying ) requestAnimationFrame( this.scorePlayLoop.bind( this ))
	return this
}
BEEP.Instrument.prototype.scorePlay = function(){

	if( Object.keys( this.triggers ).length ){
	
		this.scoreIsPlaying = true
		this.scorePlayLoop()
		this.domScorePlayPause.classList.add( 'is-playing' )
	}
	return this
}
BEEP.Instrument.prototype.scoreStop = function(){

	this.scoreIsPlaying = false
	this.pause()
	this.domScorePlayPause.classList.remove( 'is-playing' )
	return this
}
BEEP.Instrument.prototype.scoreToggle = function(){

	if( this.scoreIsPlaying ) this.scoreStop()
	else this.scorePlay()
	return this
}
BEEP.Instrument.prototype.scoreUnload = function(){

	this.scoreStop()
	this.scoreCompleted = []
	this.scoreRemaining = []
	this.beats          = 0
	this.timePrevious   = 0
}




//  http://en.wikipedia.org/wiki/Solf%C3%A8ge

BEEP.Instrument.prototype.scoreLoadDoReMi = function(){

	var
	melody = [

		36/4, '4C',  6/4,//  Do[e]
		 6/4, '4D',  2/4,//  a
		 2/4, '4E',  5/4,//  deer		
		 6/4, '4C',  2/4,//  A
		 2/4, '4E',  4/4,//  fe
		 4/4, '4C',  3/4,//  male
		 4/4, '4E',  4/4,//  deer

		 8/4, '4D',  6/4,//  Re [Ray]
		 6/4, '4E',  2/4,//  a
		 2/4, '4F',  1/4,//  drop
		 2/4, '4F',  1/4,//  of
		 2/4, '4E',  2/4,//  gold
		 2/4, '4D',  2/4,//  en
		 2/4, '4F',  8/4,//  sun

		16/4, '4E',  6/4,//  Mi [Me]
		 6/4, '4F',  2/4,//  a
		 2/4, '4G',  5/4,//  name
		 6/4, '4E',  2/4,//  I 
		 2/4, '4G',  4/4,//  call
		 4/4, '4E',  3/4,//  my
		 4/4, '4G',  6/4,//  self

		 8/4, '4F',  6/4,//  Fa[r]
		 6/4, '4G',  2/4,//  a
		 2/4, '4A',  1/4,//  long
		 2/4, '4A',  1/4,//  long
		 2/4, '4G',  2/4,//  way
		 2/4, '4F',  2/4,//  to
		 2/4, '4A',  8/4,//  run

		16/4, '4G',  6/4,//  So [Sew]
		 6/4, '4C',  2/4,//  a
		 2/4, '4D',  2/4,//  nee
		 2/4, '4E',  2/4,//  dle
		 2/4, '4F',  2/4,//  pull
		 2/4, '4G',  2/4,//  ing
		 2/4, '4A', 12/4,//  thread
	
		16/4, '4A',  6/4,//  La
		 6/4, '4D',  2/4,//  a
		 2/4, '4E',  2/4,//  note
		 2/4, '4F',  2/4,//  to
		 2/4, '4G',  2/4,//  fol
		 2/4, '4A',  2/4,//  low
		 2/4, '4B', 12/4,//  So

		16/4, '4B',  6/4,//  Ti [Tea]
		 6/4, '4E',  2/4,//  a
		 2/4, '4F',  2/4,//  drink
		 2/4, '4G',  2/4,//  with
		 2/4, '4A',  2/4,//  jam
		 2/4, '4B',  2/4,//  and
		 2/4, '5C', 12/4,//  bread

		12/4, '4A',  1/4,//  That
		 2/4, '4A',  1/4,//  will
		 2/4, '4A',  3/4,//  bring
		 4/4, '4F',  3/4,//  us
		 4/4, '4B',  3/4,//  back
		 4/4, '4G',  3/4,//  to
		 4/4, '5C',  8/4,//  Do

		 4/4, '3C', 1/16,
		1/16, '3D', 1/16,
		1/16, '3C', 1/16,
		1/16, '3E', 1/16,
		1/16, '3F', 1/16,
		1/16, '3G', 1/16,
		1/16, '3A', 1/16,
		1/16, '3B', 1/16,
		1/16, '4C', 1/16,
		1/16, '4D', 1/16,
		1/16, '4C', 1/16,
		1/16, '4E', 1/16,
		1/16, '4F', 1/16,
		1/16, '4G', 1/16,
		1/16, '4A', 1/16,
		1/16, '4B', 1/16,
		1/16, '5C',  8/4,
		 2/4, '4C',  6/4,
		 2/4, '3C',  4/4,
	],
	harmony = [
	
		4/4, '3C', 1/4,//  Intro measures...
		4/4, '3G', 1/4,
		4/4, '3C', 1/4,
		4/4, '3G', 1/4,
		4/4, '3C', 1/4,
		4/4, '3G', 1/4,
		4/4, '3C', 1/4,
		4/4, '3G', 1/4,

		4/4, '3C', 2/4,//  Do[e]
		4/4, '3G', 2/4,
		4/4, '3C', 2/4,
		4/4, '3G', 2/4,
		4/4, '3C', 2/4,
		4/4, '3G', 2/4,
		4/4, '3C', 2/4,
		4/4, '3G', 2/4,

		4/4, '3F', 2/4,//  Re [Ray]
		4/4, '3D', 2/4,
		4/4, '3F', 2/4,
		4/4, '3D', 2/4,
		4/4, '3F', 2/4,
		4/4, '3D', 2/4,
		4/4, '3F', 2/4,
		4/4, '3D', 2/4,

		4/4, '3G', 2/4,//  Mi [Me]
		4/4, '3E', 2/4,
		4/4, '3G', 2/4,
		4/4, '3E', 2/4,
		4/4, '3G', 2/4,
		4/4, '3E', 2/4,
		4/4, '3G', 2/4,
		2/4, '3F', 2/4,
		2/4, '3E', 2/4,
		2/4, '3D', 2/4,

		2/4, '3F', 2/4,//  Fa[r]
		4/4, '3D', 2/4,
		4/4, '3F', 2/4,
		4/4, '3D', 2/4,
		4/4, '3F', 2/4,
		4/4, '3D', 2/4,		
		4/4, '3G', 2/4,
		2/4, '3F', 2/4,
		2/4, '3E', 2/4,
		2/4, '3D', 2/4,
		2/4, '3C', 2/4,

		2/4, '3D', 2/4,//  So [Sew]
		2/4, '3E', 2/4,
		2/4, '3F', 2/4,
		2/4, '3G', 2/4,
		2/4, '3A', 2/4,
		2/4, '3B', 2/4,
		2/4, '4C', 2/4,
		2/4, '3C', 2/4,
		2/4, '3D', 2/4,
		2/4, '3E', 2/4,
		2/4, '3F', 2/4,
		2/4, '3G', 2/4,
		2/4, '3A', 2/4,
		2/4, '3B', 2/4,
		2/4, '4C', 2/4,

		2/4, '3C', 2/4,//  La
		2/4, '3D', 2/4,
		2/4, '3E', 2/4,
		2/4, '3F', 2/4,
		2/4, '3G', 2/4,
		2/4, '3A', 2/4,
		2/4, '3B', 2/4,
		2/4, '4C', 4/4,
		4/4, '3B', 2/4,
		2/4, '3A', 2/4,
		2/4, '3G', 2/4,
		2/4, '3F', 2/4,
		2/4, '3E', 2/4,
		2/4, '3D', 2/4,

		2/4, '3C', 4/4,//  End of La / beginning of Ti

		4/4, '3D', 2/4,
		2/4, '3E', 2/4,
		2/4, '3F', 2/4,
		2/4, '3G', 2/4,
		2/4, '3A', 2/4,
		2/4, '3B', 2/4,
		2/4, '4C', 4/4,
		4/4, '3B', 2/4,
		2/4, '3A', 2/4,
		2/4, '3G', 2/4,
		2/4, '3F', 2/4,
		2/4, '3E', 2/4,
		2/4, '3D', 2/4,
		2/4, '3C', 2/4,

		2/4, '3G', 2/4,//  When
		2/4, '3C', 2/4,//  you
		2/4, '3A', 2/4,//  know
		2/4, '3F', 2/4,//  the
		2/4, '3E', 2/4,//  notes
		2/4, '3C', 2/4,//  to
		2/4, '3D', 4/4,//  sing
		
		4/4, '3G', 2/4,//  you
		2/4, '3C', 2/4,//  can
		2/4, '3A', 2/4,//  sing
		2/4, '3B', 2/4,//  most
		2/4, '4C', 2/4,//  an
		2/4, '4D', 2/4,//  y
		2/4, '4C', 4/4,//  thing
	]

	this.scoreUnload()
	this.scoreLoad( melody )
	this.scoreLoad( harmony )
}
BEEP.Instrument.prototype.scoreLoadHSB = function(){

	var guitar = [

		4/4, '3A♭', 3/4,
		4/4, '4E♭', 3/4,
		4/4, '4A♭', 3/4,
		4/4, '4E♭', 3/4,
	]
	
	this.scoreUnload()
	this.scoreLoad( guitar )
}







