



document.addEventListener( 'DOMContentLoaded', function(){


	//  This is it -- making an Instrument is this easy!
	//  That’s because of our “batteries includied” approach.
	//  One line of code gives you the whole setup:

	window.synth = new BEEP.Instrument( 'synth' )




	//  But here’s just a hint of what’s possible:
	//  You can send a custom function for creating Voices to
	//  your instance of Instrument. Use as many Voices in it
	//  as you’d like. Everything just works.

	/*window.synth = new BEEP.Instrument( 'synth', function(){


		//  Let’s call this our “Foundation Voice”
		//  because it will sing the intended Note.

		this.voices.push( 

			new BEEP.Voice( this.note, this.audioContext )
			.setOscillatorType( 'sine' )
			.setGainHigh( 0.4 )
		)


		//  This Voice will sing a Perfect 5th above the Foundation Voice.

		this.voices.push( 

			new BEEP.Voice( this.note.hertz * 3 / 2, this.audioContext )
			.setOscillatorType( 'triangle' )
			.setGainHigh( 0.1 )
		)


		//  This Voice will sing 2 octaves above the Foundation Voice.

		this.voices.push( 

			new BEEP.Voice( this.note.hertz * 4, this.audioContext )
			.setOscillatorType( 'sawtooth' )
			.setGainHigh( 0.01 )
		)


		//  This Voice will sing 1 octave below the Foundation Voice.

		this.voices.push( 

			new BEEP.Voice( this.note.hertz / 2, this.audioContext )
			.setOscillatorType( 'square' )
			.setGainHigh( 0.01 )
		)
	})
	synth.buildCRainbow()*/

	


})







