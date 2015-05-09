/*


	Beep.Note




	Requires 

	  1  Beep

	Description

	  Not sounds or oscillators, but mathematical models
	  resolving to frequencies in Hertz.

	Example uses

	  note = new Beep.Note( '3eb' )
	  note = new Beep.Note.EDO12( '3eb' )
	  note = new Beep.Note.JustIntonation( 'C#3', 'C#2' )

	Roadmap

	  I knew this was complicated but it’s far moreso than I realized!
	  Need to revisit all of this in much more depth once some more 
	  functionality and interface fixes have been completed:
	  https://github.com/stewdio/beep.js/issues/2
	  http://everything2.com/title/The+difference+between+tritone%252C+augmented+fourth%252C+diminished+fifth%252C+%252311+and+b5


*/




Beep.Note = function( params ){

	var that = this
 
 	if( typeof params === 'number' ) this.hertz = params
 	else if( typeof params === 'object' && params.hertz !== undefined ){
	
		Object.keys( params ).forEach( function( key ){

			that[ key ] = params[ key ]
		})
	}
	else return Beep.Note.EDO12( params )
}




//  Common Western music has 12 notes per octave,
//  lettered A through G with modifier symbols for sharps and flats.
//  Let’s build a validator for Western music:

Beep.Note.validateWestern = function( params ){

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
	else if( params.octaveIndex > 8 ) params.octaveIndex = 8


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
	

	//  Is this cleanse here still necessary?

	params = setLetterByLetterIndex( params )


	//  Let’s make sure we have the .name (letter + modifier)
	//  and the .nampleSimple (letter yes, but only a modifier
	//  if unnatural) and set the .nameIndex appropriately.

	params.name = params.letter + params.modifier
	params.nameSimple = params.letter
	if( params.modifier !== '♮' ) params.nameSimple += params.modifier
	params.nameIndex = NAMES.indexOf( params.name )


	//  Final gotcha: Let’s only allow a C Natural in the 8th octave.

	if( params.octaveIndex === 8 && params.nameSimple !== 'C' ) params.octaveIndex = 7


	//  Set the .pianoKeyIndex and then the corresponding MIDI Number.

	params.pianoKeyIndex = params.octaveIndex * 12 + params.nameIndex
	if( params.nameIndex > 3 ) params.pianoKeyIndex -= 12
	params.midiNumber = params.pianoKeyIndex + 20


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

Beep.Note.EDO12 = function( params ){
	
	params = Beep.Note.validateWestern( params )


	//  The Cent is a logarithmic unit of measure that divide
	//  the 12-tone equal temperament octave into 12 semitones 
	//  of 100 cents each.
	//  http://en.wikipedia.org/wiki/Cent_(music)

	//   + 0¢  UNISON
	//   100¢  minor   2nd
	//   200¢  MAJOR   2nd
	//   300¢  minor   3rd
	//   400¢  MAJOR   3rd
	//   500¢  PERFECT 4th
	//   600¢  tritone
	//   700¢  PERFECT 5th
	//   800¢  minor   6th
	//   900¢  MAJOR   6th
	//  1000¢  minor   7th
	//  1100¢  MAJOR   7th
	//  1200¢  OCTAVE

	params.hertz = params.A * Math.pow( Math.pow( 2, 1 / 12 ), params.pianoKeyIndex - 49 )
	params.tuning = 'EDO12'
	return new Beep.Note( params )
}


//  The most mathematically beautiful tuning,
//  makes for sonically gorgeous experiences
//  ... Until you change keys!

Beep.Note.JustIntonation = function( params, key ){

	var 
	that = this,
	relationshipIndex

	params = Beep.Note.validateWestern( params )
	params.tuning = 'JustIntonation'
	params.key = new Beep.Note.EDO12( key )


	//  This is Ptolemy’s “Intense Diatonic Scale” which is based on 
	//  Pythagorean tuning. It is but one example of Just Intonation.
	//  http://en.wikipedia.org/wiki/Ptolemy%27s_intense_diatonic_scale
	//  http://en.wikipedia.org/wiki/Pythagorean_tuning
	//  http://en.wikipedia.org/wiki/List_of_pitch_intervals
	//  http://www.chrysalis-foundation.org/just_intonation.htm 

	relationshipIndex = ( params.nameIndex - params.key.nameIndex ) % 12
	if( relationshipIndex < 0 ) relationshipIndex += 12
	params.hertz = [

		params.key.hertz,          //  Do  UNISON
		params.key.hertz * 16 / 15,//      minor     2nd
		params.key.hertz *  9 /  8,//  Re  MAJOR     2nd
		params.key.hertz *  6 /  5,//      minor     3rd
		params.key.hertz *  5 /  4,//  Mi  MAJOR     3rd
		params.key.hertz *  4 /  3,//  Fa  PERFECT   4th
		params.key.hertz * 45 / 32,//      augmented 4th
		params.key.hertz *  3 /  2,//  So  PERFECT   5th
		params.key.hertz *  8 /  5,//      minor     6th
		params.key.hertz *  5 /  3,//  La  MAJOR     6th
		params.key.hertz * 16 /  9,//      minor     7th (HD, baby!)
		params.key.hertz * 15 /  8,//  Ti  MAJOR     7th
		params.key.hertz *  2      //  Do  OCTAVE
	
	][ relationshipIndex ]


	//  If the key’s octave and our desired note’s octave were equal
	//  then we’d be done. Otherwise we’ve got to bump up or down our 
	//  note by whole octaves.
	
	params.hertz = params.hertz * Math.pow( 2, params.octaveIndex - params.key.octaveIndex )
	return new Beep.Note( params )
}




//  Does this thing look like it could be a Note?

Beep.Note.seemsLegit = function( x ){

	var 
	seemsLegit    = true,
	noteNames     = 0,
	octaveIndexes = 0,
	modifiers     = 0,
	flatOrBs      = 0,
	chr, i

	if( x instanceof Beep.Note ) return true//  Is an actual Beep.Note.
	else if( typeof x === 'number' ) return true//  Expecting this to be a Hertz value.
	else if( typeof x === 'string' ){


		//  Longest combo we expect is 
		//  Note Name (1 char) + 
		//  OctaveIndex (1 char, value 0–8) + 
		//  Modifier (1 char, ♮♯♭#b).

		if( x.length > 3 ) return false

	
		//  Here are the maximum possible outcomes:
		//  octaves    1  1  1
		//  noteNames  1  1  0
		//  modifiers  1  0  1
		//  flatOrBs   0  1  1

		for( i = 0; i < x.length; i ++ ){

			chr = x[ i ]
			if( +chr + '' !== 'NaN' && +chr >= 0 && +chr <= 8 ) octaveIndexes ++			
			else if( 'ABCDEFGHacdefgh'.indexOf( chr ) >= 0 ) noteNames ++
			else if( '♮♯♭#'.indexOf( chr ) >= 0 ) modifiers ++
			else if( 'b' === chr ) flatOrBs ++
			else {

				seemsLegit = false
				break
			}
		}
		//console.log( octaveIndexes, noteNames, modifiers, flatOrBs )
		if( octaveIndexes > 1 || 
			noteNames > 1 ||
			modifiers > 1 ||
			flatOrBs  > 1 ||
			noteNames + modifiers + flatOrBs > 2 ) seemsLegit = false

		return seemsLegit
	}
	else return false
}







