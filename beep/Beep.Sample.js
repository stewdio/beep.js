/*


	Beep.Sample




	Requires 

	  1  Beep

	Description

	  Samples are playable representations of audio files. I think?

	Example uses

	  sample = new Beep.Sample( '2legit.mp4' )

	Roadmap

	  Add support for pitch bending so one loaded sample can 
	  be used in place of Note.


*/




Beep.Sample = function(){

	var a, i

	for( i = 0; i < arguments.length && i <= 3; i ++ ){

		a = arguments[ i ]


		//  If we were passed a String then
		//  it should either be a URL for an audio file
		//  or the ID for a DOM Element.

		if( typeof a === 'string' ){

			if( Beep.Sample.seemsLikeAudioFileName( a )) this.domElement = new Audio( a )
			else this.domElement = document.getElementById( a )
		}


		//  We’re also hoping for an audio connection
		//  to hook this sample up to.

		else if( a instanceof Beep.AudioContext ){

			this.audioContext = a
			this.destination  = a.destination
		}
		else if( a instanceof GainNode ){

			this.audioContext = a.audioContext
			this.destination  = a
		}
	}


	//  Contingency planning.

	if( this.domElement instanceof HTMLAudioElement === false ) this.domElement = new Audio()
	if( this.audioContext === undefined ){

		this.audioContext = new Beep.AudioContext()
		this.destination  = this.audioContext.destination
	}


	//  Config some bid-niz.
	//  Note to all you peeps running this off your desktop:
	//  By setting .crossOrigin to 'anonymous' you can load
	//  audio files from an http: or https: but NOT file: protocol.
	//  So you will NOT be able to load local files :(

	this.domElement.crossOrigin = 'anonymous'
	this.domElement.preload = 'auto'
	this.domElement.loop = 'loop'
	if( this.domElement.src === undefined ) this.domElement.src = 'https://storage.googleapis.com/chhirp-prod-aac-hdortfjlzncw/50e7eb29-a951-4757-942c-981b4c521d36.mp4'


	//  The trick is you must create a “Media Element Source”
	//  from the HTML Audio Element, and then connect that source
	//  up to the Web Audio API context. Slightly wonky.

	this.source = Beep.audioContext.createMediaElementSource( this.domElement )
	this.source.mediaElement.crossOrigin = 'anonymous'
	// this.filter = this.audioContext.createBiquadFilter()
	// this.filter.type = this.filter.LOWPASS
	// this.filter.frequency.value = 500
	// this.source.connect( this.filter )
	// this.filter.connect( this.gainNode )
	this.source.connect( this.destination )


	//  Good to know when it’s time to go home.

	this.isTorndown = false


	//  Push a reference of this instance into Beep’s library
	//  so we can access and/or teardown it later.

	Beep.samples.push( this )
}




Beep.Sample.seemsLikeAudioFileName = function( s ){

	return typeof s === 'string' && s.search( /\.(aac|mp3|mp4|ogg|webm|wav)(\?.*|)$/ ) >= 0
}




Beep.Sample.prototype.teardown = function(){

	if( this.isTorndown === false ){

		this.source.disconnect()
		this.isTorndown = true
	}
	return this
}







