/*


	NOTES

	Not sounds or oscillators, but mathematical models
	resolving to frequencies in Hertz. Here are some examples:


	new Note( '3eb' )
	new Note.EDO12( '3eb' )
	
	//  {
	//		A: 440,
	//		hertz: 155.5634918610404,
	//		letter: "E",
	//		letterIndex: 4,
	//		modifier: "♭",
	//		name: "E♭",
	//		nameIndex: 7,
	//		octaveIndex: 3,
	//		pianoKeyIndex: 31,
	//		tuning: "EDO12"
	//	}


	new Note.JustIntonation( 'C#3', 'C#2' )

	//	{
	//		A: 440,
	//		hertz: 34.64782887210901,
	//		key: Note.EDO12 {
	//			A: 440,
	//			hertz: 138.59131548843604,
	//			letter: "C",
	//			letterIndex: 2,
	//			modifier: "♯",
	//			name: "C♯",
	//			nameIndex: 5,
	//			octaveIndex: 3,
	//			pianoKeyIndex: 29,
	//			tuning: "EDO12"
	//		},
	//		letter: "C",
	//		letterIndex: 2,
	//		modifier: "♯",
	//		name: "C♯",
	//		nameIndex: 5,
	//		octaveIndex: 2pianoKeyIndex: 17,
	//		tuning: "EDO12"
	//	}


*/




BEEP.Note = function( params ){

	var that = this
 
 	if( typeof params === 'number' ) this.hertz = params
 	else if( typeof params === 'object' && params.hertz !== undefined ){
	
		Object.keys( params ).forEach( function( key ){

			that[ key ] = params[ key ]
		})
	}
	else return BEEP.Note.EDO12( params )
}




//  Common Western music has 12 notes per octave,
//  lettered A through G with modifier symbols for sharps and flats.
//  Let’s build a validator for Western music:

BEEP.Note.validateWestern = function( params ){

	var 
	NAMES   = [ 'A♭', 'A♮', 'B♭', 'B♮', 'C♮', 'C♯', 'D♮', 'E♭', 'E♮', 'F♮', 'F♯', 'G♮' ],
	LETTERS = 'ABCDEFG',
	SHARPS  = 'CF',
	FLATS   = 'EAB',
	temp

	if( typeof params === 'undefined' ) params = {}
	else if( typeof params === 'string' ){

		temp = params
		params = {}
		temp.split( '' ).forEach( function( p, i ){

			if( +p + '' !== 'NaN' ) params.octaveIndex = +p
			else if( '♭♮♯#'.indexOf( p ) !== -1 ){

				params.modifier = p
			}
			else if(( LETTERS + 'H' ).indexOf( p.toUpperCase() ) !== -1 ){

				if( p.toUpperCase() === 'H' ) params.letter = 'B'
				else if( p === 'b' && i > 0 ) params.modifier = '♭'
				else params.letter = p.toUpperCase()
			}
		})
	}


	//  What octave is this?

	if( params.octaveIndex === undefined 
		|| params.octaveIndex === ''
		|| +params.octaveIndex +'' === 'NaN' ) params.octaveIndex = 4
	params.octaveIndex = +params.octaveIndex
	if( params.octaveIndex < 0 ) params.octaveIndex = 0
	else if( params.octaveIndex > 7 ) params.octaveIndex = 7


	//  What’s this Note’s name?

	if( params.letter === undefined ) params.letter = 'A'
	params.letterIndex = LETTERS.indexOf( params.letter )
	if( params.modifier === undefined ) params.modifier = '♮'
	if( params.A === undefined ) params.A = 440.00


	//  Force the correct accidental symbols.

	if( params.modifier === 'b' ) params.modifier = '♭'
	if( params.modifier === '#' ) params.modifier = '♯'
	

	//  Handy function for redefining the letter
	//  when the letterIndex may have shifted.

	function setLetterByLetterIndex( params ){

		if( params.letterIndex < 0 ){

			params.letterIndex += LETTERS.length
			params.octaveIndex --
		}
		if( params.letterIndex >= LETTERS.length ){

			params.letterIndex -= LETTERS.length
			//  Next line commented out but left in as a reminder
			//  that it would cause G♯ conversion to A♭
			//  to jump up an entire octave for no good reason!
			//params.octaveIndex ++
		}
		params.letter = LETTERS.substr( params.letterIndex, 1 )
		return params
	}


	//  Force the correct sharp / flat categorization.
	//  Why does the Equal Temperament scale consider certain letters flat or sharp
	//  when they are mathematically equal?!
	//  Has to do with the delta between Equal Temperament and the Just Scale.
	//  Where Equal Temperament comes in higher than Just we call it sharp,
	//  and where it comes in lower than Just we call it flat:
	//  http://www.phy.mtu.edu/~suits/scales.html

	if( params.modifier === '♭' && FLATS.indexOf( params.letter ) === -1 ){

		params.letterIndex = LETTERS.indexOf( params.letter ) - 1
		params = setLetterByLetterIndex( params )
		if( SHARPS.indexOf( params.letter ) > -1 ) params.modifier = '♯'
		else params.modifier = '♮'
	}
	else if( params.modifier === '♯' && SHARPS.indexOf( params.letter ) === -1 ){
	
		params.letterIndex = LETTERS.indexOf( params.letter ) + 1
		params = setLetterByLetterIndex( params )
		if( FLATS.indexOf( params.letter ) > -1 ) params.modifier = '♭'
		else params.modifier = '♮'
	}
	

	//  Now that we’re certain the modifier is correct
	//  we can set convenience booleans.

	if( params.modifier === '♯' ) params.isSharp = true
	else if( params.modifier === '♭' ) params.isFlat = true
	else params.isNatural = true
	

	//  A final cleanse. Should test if this is still necessary...

	params = setLetterByLetterIndex( params )


	//  Penultimate bits...	

	params.name = params.letter + params.modifier
	params.nameSimple = params.letter
	if( params.modifier !== '♮' ) params.nameSimple += params.modifier
	params.nameIndex = NAMES.indexOf( params.name )
	params.pianoKeyIndex = params.octaveIndex * 12 + params.nameIndex
	if( params.nameIndex > 3 ) params.pianoKeyIndex -= 12


	//  What tuning method are we supposed to use? 

	if( params.tuning === undefined ) params.tuning = 'EDO12'
	

	//  We now have the majority of the Note ready for use.
	//  Everything except for ... the FREQUENCY of the Note!
	//  That will be decided based on the tuning method.

	return params
}




    /////////////////
   //             //
  //   Tunings   //
 //             //
/////////////////


//  EQUAL DIVISION OF OCTAVE INTO 12 UNITS
//  -     -           -           --
//  Does exactly what it says on the tin, man.

BEEP.Note.EDO12 = function( params ){
	
	params = BEEP.Note.validateWestern( params )
	params.hertz = params.A * Math.pow( Math.pow( 2, 1 / 12 ), params.pianoKeyIndex - 49 )
	params.tuning = 'EDO12'
	return new BEEP.Note( params )
}


//  The most mathematically beautiful tuning,
//  makes for sonically gorgeous experiences
//  ... until you change keys! 

BEEP.Note.JustIntonation = function( params, key ){

	var 
	that = this,
	relationshipIndex

	params = Note.validateWestern( params )
	params.tuning = 'JustIntonation'
	params.key = new BEEP.Note.EDO12( key )


	//  http://en.wikipedia.org/wiki/Pythagorean_tuning
	//  http://en.wikipedia.org/wiki/Quarter-comma_meantone
	//  http://www.chrysalis-foundation.org/just_intonation.htm 
	//  1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 16/9, 15/8, 2/1

	relationshipIndex = ( params.nameIndex - params.key.nameIndex ) % 12
	if( relationshipIndex < 0 ) relationshipIndex += 12
	params.hertz = [

		params.key.hertz,
		params.key.hertz * 16 / 15,
		params.key.hertz *  9 /  8,
		params.key.hertz *  6 /  5,
		params.key.hertz *  5 /  4,
		params.key.hertz *  4 /  3,
		params.key.hertz * 45 / 32,
		params.key.hertz *  3 /  2,//  Perfect Fifth
		params.key.hertz *  8 /  5,
		params.key.hertz *  5 /  3,
		params.key.hertz * 16 /  9,
		params.key.hertz * 15 /  8,
		params.key.hertz *  2
	
	][ relationshipIndex ]


	//  If the key’s octave and our desired note’s octave were equal
	//  then we’d be done. Otherwise ...
	//  We’ve got to bump up or down our note by whole octaves!
	
	params.hertz = params.hertz * Math.pow( 2, params.octaveIndex - params.key.octaveIndex )
	return new BEEP.Note( params )
}







