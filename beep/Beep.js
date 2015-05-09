/*


	Beep




	Description

	  A JavaScript toolkit for building browser-based synthesizers.


*/




var Beep = {

	VERSION: 7,


	//  How much console output should we have, really?
	//  Expecting a value between 0 and 1 inclusive
	//  where 0 = nothing and 1 = everything possible.

	verbosity: 0.5,


	//  Chrome, Opera, and Firefox already provide AudioContext()
	//  but Safari instead provides webkitAudioContext().
	//  Let’s just standardize this for our own sanity right here:

	AudioContext: window.AudioContext ? window.AudioContext : window.webkitAudioContext,


	//  We’ll keep track of Voices, Triggers, and Instruments
	// (but not Notes because we just throw those away left and right)
	//  so we can access and/or teardown them later even if unnamed.

	voices:      [],
	samples:     [],
	triggers:    [],
	instruments: [],


	//  Once the “DOM Content Loaded” event fires we’ll come back
	//  and set this to either an existing DOM Element with a #beep ID
	//  or create a new element and append it to the Body.

	domContainer: null,


	//  This will be rather useful for bypassing keyboard Event Listeners.
	//  @@ Will come back and rename this / improve its functionality 
	//  so that any focus on a text area stops Triggers from firing!

	isKeyboarding: true,


	//  When the system’s ready (ie. DOM content loaded, etc.)
	//  we may need to perform some setup tasks.

	setupTasks: [

		function(){

			if( Beep.audioContext === undefined ) Beep.audioContext = new Beep.AudioContext()
		},
		function(){

			if( Beep.domContainer === null ) Beep.domContainer = document.getElementById( 'beep' )
		},
		function(){

			if( Beep.verbosity > 0 ) console.log( 'Beep', Beep.VERSION )
		}
	],


	//  Right now just runs Beep.eval() but in the near future
	//  we might have some more tricks up our sleeve...

	setup: function(){

		var task

		while( task = this.setupTasks.shift() ){

			if( typeof task === 'function' ) task()
		}
	},


	//  Teardown everything. EVERYTHING. DO IT. DO IT NOW.

	teardown: function(){

		while( this.instruments.length ){

			this.instruments.pop().teardown()
		}
		while( this.triggers.length ){

			this.triggers.pop().teardown()
		}
		while( this.samples.length ){

			this.samples.pop().teardown()
		}
		while( this.voices.length ){

			this.voices.pop().teardown()
		}
	},


	//  We need to tear everything down.
	//  Then build it right back up.

	reset: function(){

		this.teardown()
		this.setup()
	},


	//  JavaScript does not natively support multiline String literals.
	//  Sure, you can construct a string and include a “\n” or “\r” and
	//  ok, I admit you can do the “\” + actual line return trick in some cases
	//  but the most reliable (and forget Internet Explorer) way is to create
	//  a function which includes multiline *comments* (OMFG!), 
	//  then parse the Function literal itself as a String!

	parseMultilineString: function( f ){

		f = f.toString()
		
		var 
		begin = f.indexOf( '/*' ) + 2,
		end   = f.indexOf( '*/', begin )
					
		return f.substring( begin, end ).replace( /\/\+/g, '/*' ).replace( /\+\//g, '*/' )
	}
}




//  Once our DOM Content is ready for action
//  it’s time to GIVE IT ACTION. W000000000000T !

document.addEventListener( 'DOMContentLoaded', function(){

	Beep.setup()
})







