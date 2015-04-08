



var BEEP = {

	VERSION: 3,


	//  Chrome, Opera, and Firefox already provide AudioContext()
	//  but Safari instead provides webkitAudioContext().
	//  Let’s just standardize this for our own sanity right here:

	AudioContext: window.AudioContext ? window.AudioContext : window.webkitAudioContext,


	//  We’ll keep track of Voices, Triggers, and Instruments
	// (but not Notes because we just throw those away left and right)
	//  so we can access and/or destroy them later even if unnamed.

	voices:      [],
	triggers:    [],
	instruments: [],
	midiInputs:  [],


	//  Once the “DOM Content Loaded” event fires we’ll come back
	//  and set this to either an existing DOM Element with a #beep ID
	//  or create a new element and append it to the Body.

	domContainer: null,


	//  Destroy everything. EVERYTHING. DO IT. DO IT NOW.

	destroy: function(){

		while( this.voices.length ){

			this.voices.pop().destroy()
		}
		while( this.triggers.length ){

			this.triggers.pop().destroy()
		}
		while( this.instruments.length ){

			this.instruments.pop().destroy()
		}
	},


	//  Create a new Instrument from the code
	//  currently in the code editor.

	eval: function(){

		var code = document.getElementById( 'editor' ).value

		try {

			eval( code )	
		}
		catch( e ){

			console.log( 'OMFG', e )
		}
	},

	//  Trigger any triggers if midi message applies.

	onMidiMessage: function (midiMessageEvent){

		this.triggers.forEach(function (trigger){

			if (trigger.midiNumber !== midiMessageEvent.data[1])
				return;

			if (midiMessageEvent.data[2] > 0)
				trigger.play();
			else
				trigger.pause();
		});
	},

	//  Get an instance of MIDIAccess if it's available.

	initializeMidi: function (callback){

		if (!navigator.requestMIDIAccess)
			return callback()

		var that = this

		function success (midiAccess){

			midiAccess.inputs.forEach(function (midiInput){ 

				that.midiInputs.push(midiInput)
			})

			if (midiAccess.inputs.size)
				that.midiInputs[0].onmidimessage = that.onMidiMessage.bind( that )

			callback()
		}

		navigator.requestMIDIAccess().then(success, callback)
	},


	//  Run this to setup BEEP

	boot: function(){

		var that = this

		this.initializeMidi(function (){

			that.eval()
		})
	},


	//  We need to tear everything down.
	//  Then build it right back up.

	reset: function(){

		this.destroy()
		this.boot()
	}
}


//  We might as well create an instance of AudioContext
//  that we can re-use over and over if necessary.
//  Why? Because the number of AudioContext instance is
//  limited by hardware. For example, my personal laptop
//  can only handle 6 of them at once!

BEEP.audioContext = new BEEP.AudioContext()


//  Once our DOM Content is ready for action
//  it’s time to GIVE IT ACTION. W000000000000T !

document.addEventListener( 'DOMContentLoaded', function(){

	BEEP.domContainer = document.getElementById( 'beep' )
	BEEP.boot()
})







