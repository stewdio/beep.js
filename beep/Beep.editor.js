/*


	Beep.editor




	Requires 

	  1  Beep

	Sample program requires

	  1  Beep
	  2  Beep.Note
	  3  Beep.Voice
	  4  Beep.Sample
	  5  Beep.Trigger
	  6  Beep.Instrument


*/




Beep.editor = {


	domContainer: null,
	domEditor: null,


	toggle: function(){

		if( Beep.isKeyboarding ){

			Beep.editor.domContainer.classList.add( 'show' )
			Beep.editor.domEditor.focus()
			Beep.isKeyboarding = false
		}
		else {

			Beep.editor.domContainer.classList.remove( 'show' )
			Beep.isKeyboarding = true
		}
	},


	saveSelection: function( containerEl ){

		var
		range,
		preSelectionRange,
		start = 0,
		end   = 0

		if( window.getSelection && document.createRange ){

			if( window.getSelection().type !== 'None' ){
			
				range = window.getSelection().getRangeAt( 0 )
				preSelectionRange = range.cloneRange()
				preSelectionRange.selectNodeContents( containerEl )
				preSelectionRange.setEnd( range.startContainer, range.startOffset )
				start = preSelectionRange.toString().length
				end   = start + range.toString().length
			}
		}
		else {

			range = document.selection.createRange()
			preSelectionRange = document.body.createTextRange()
			preSelectionRange.moveToElementText( containerEl )
			preSelectionRange.setEndPoint( 'EndToStart', range )
			start = preSelectionRange.text.length
			end   = start + range.text.length
		}
		return { start: start, end: end }
	},
	

	restoreSelection: function( containerEl, savedSel ){

		if( window.getSelection && document.createRange ){

			var
			charIndex  = 0, 
			range      = document.createRange(),
			nodeStack  = [ containerEl ],
			node,
			foundStart = false, 
			stop       = false,
			nextCharIndex,
			i,
			sel

			range.setStart( containerEl, 0 )
			range.collapse( true )
			nodeStack = [ containerEl ]
			while( !stop && ( node = nodeStack.pop() )){
				
				if( node.nodeType === 3 ){
					
					var nextCharIndex = charIndex + node.length

					if( !foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex ){
						
						range.setStart( node, savedSel.start - charIndex )
						foundStart = true
					}
					if( foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex ){
						
						range.setEnd( node, savedSel.end - charIndex )
						stop = true
					}
					charIndex = nextCharIndex
				} 
				else {
					
					i = node.childNodes.length
					while( i -- ){
						
						nodeStack.push( node.childNodes[ i ])
					}
				}
			}
			sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange( range )
		}
		else {

			var textRange = document.body.createTextRange()
	 
			textRange.moveToElementText( containerEl )
			textRange.collapse( true )
			textRange.moveEnd( 'character', savedSel.end )
			textRange.moveStart( 'character', savedSel.start )
			textRange.select()
		}
	},


	colorize: function(){

		var 
		el   = Beep.editor.domContainer.querySelector( '#eval-status' ),
		code = Beep.editor.domEditor.textContent,
		selection = Beep.editor.saveSelection( Beep.editor.domEditor )
		

		//  First, update our eval-able status.

		el.classList.remove( 'good' )
		el.classList.remove( 'bad' )
		el.classList.add( 'ugly' )

		
		//  Next, dim the code comments.

		code = code.replace( /(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, function( match, p1, offset, string ){

			return '<span class="beep-commented">'+ match +'</span>'
		})
		Beep.editor.domEditor.innerHTML = code
		Beep.editor.restoreSelection( Beep.editor.domEditor, selection )
	},


	//  My sincere apologies to Doug Crockford.

	eval: function(){

		var 
		code = ';'+ this.domEditor.textContent,
		el = document.getElementById( 'eval-status' )

		try {

			eval( code )
			el.classList.remove( 'bad' )
			el.classList.remove( 'ugly' )
			el.classList.add( 'good' )
		}
		catch( e ){

			console.log( 'OMFG', e )
			el.classList.remove( 'good' )
			el.classList.remove( 'ugly' )
			el.classList.add( 'bad' )
		}
	},


	setup: function( program ){

		var 
		that = this,
		fullscreen = document.getElementById( 'fullscreen-container' ),
		el


		//  Create and attach the editor DOM bits.

		this.domContainer = document.createElement( 'div' )
		this.domContainer.setAttribute( 'id', 'editor-container' )
		this.domContainer.innerHTML = Beep.parseMultilineString( function(){/*
					
			<div id="editor-menu">
				<div>
					Beep.editor
					<img class="beep-button" id="editor-eval"  src="beep/Beep.editor.svg#editor-eval">
					<img class="beep-button" id="editor-close" src="beep/Beep.editor.svg#editor-close">
				</div>
			</div>
			<div><div id="eval-status"></div></div>
			<div>
				<div id="editor-content"><div id="editor" spellcheck="false" contenteditable="true"></div></div>
			</div>
		
		*/})
		if( fullscreen ) fullscreen.appendChild( this.domContainer )
		else document.body.appendChild( this.domContainer )


		//  Create and attach the button to open the editor.

		el = document.createElement( 'img' )
		el.classList.add( 'beep-button' )
		el.setAttribute( 'id', 'editor-open' )
		el.setAttribute( 'src', 'beep/Beep.editor.svg#editor-open' )
		if( fullscreen ) fullscreen.appendChild( el )
		else document.body.appendChild( el )


		//  When a user hits the Tab key the browser is going to try to 
		//  change what input field is in focus -- that’s the standard and
		//  expected behavior. Except when you’re coding something. 
		//  Then that standard behavior becomes infuriating. Let’s kill it.

		this.domEditor = this.domContainer.querySelector( '#editor' )	
		this.domEditor.addEventListener( 'keydown', function( event ){

			var
			selection,
			program

			if( event.keyCode === 9 ){
			
				selection = Beep.editor.saveSelection( this )				
				this.innerHTML = 
					this.textContent.substring( 0, selection.start ) +
					'\t' +
					this.textContent.substring( selection.end, this.textContent.length )
				Beep.editor.restoreSelection( this, { start: selection.start + 1, end: selection.start + 1 })
				Beep.editor.colorize()
				event.preventDefault()
				event.stopPropagation()
			}
			else if( event.keyCode === 13 ){

				selection = Beep.editor.saveSelection( this )
				program = this.textContent.substring( 0, selection.start )
				if( selection.end === this.textContent.length ) program += '\n\n'
				else program += '\n' + this.textContent.substring( selection.end, this.textContent.length )
				this.innerHTML = program
				Beep.editor.restoreSelection( this, { start: selection.start + 1, end: selection.start + 1 })
				Beep.editor.colorize()
				event.preventDefault()
				event.stopPropagation()
			}
		})
		this.domEditor.addEventListener( 'input', Beep.editor.colorize )


		//  Editor open button.

		el = document.getElementById( 'editor-open' )
		el.addEventListener( 'mouseenter', function(){

			this.setAttribute( 'src', 'beep/Beep.editor.svg#editor-open-hover' )
		})
		el.addEventListener( 'mouseleave', function(){

			this.setAttribute( 'src', 'beep/Beep.editor.svg#editor-open' )
		})
		el.addEventListener( 'click', Beep.editor.toggle )
		

		//  Editor close button.

		el = document.getElementById( 'editor-close' )
		el.addEventListener( 'mouseenter', function(){

			this.setAttribute( 'src', 'beep/Beep.editor.svg#editor-close-hover' )
		})
		el.addEventListener( 'mouseleave', function(){

			this.setAttribute( 'src', 'beep/Beep.editor.svg#editor-close' )
		})
		el.addEventListener( 'click', Beep.editor.toggle )


		//  Editor eval button.

		el = document.getElementById( 'editor-eval' )
		el.addEventListener( 'mouseenter', function(){

			this.setAttribute( 'src', 'beep/Beep.editor.svg#editor-eval-hover' )
		})
		el.addEventListener( 'mouseleave', function(){

			this.setAttribute( 'src', 'beep/Beep.editor.svg#editor-eval' )
		})
		el.addEventListener( 'click', function(){

			Beep.reset()
			Beep.editor.eval()
		})


		//  If a program was passed as an argument then 
		//  load it into the editor
		//  otherwise load up a default program.

		if( typeof program !== 'string' ){

			program = Beep.parseMultilineString( function(){


/*window.synth = new Beep.Instrument()
/+
.applyVoices( function(){ this.voices.push( 

	new Beep.Voice( this.note, this.audioContext )
		.setOscillatorType( 'sine' )
		.setAttackGain( 0.8 ),

	new Beep.Voice( this.note.hertz * 3 / 2, this.audioContext )
		.setOscillatorType( 'triangle' )
		.setAttackGain( 0.2 )
		.setDelayDuration( 0.05 ),

	new Beep.Voice( this.note.hertz * 4, this.audioContext )
		.setOscillatorType( 'sawtooth' )
		.setAttackGain( 0.04 ),

	new Beep.Voice( this.note.hertz / 2, this.audioContext )
		.setOscillatorType( 'square' )
		.setAttackGain( 0.06 )
)})
.addStyleClass( 'rainbow' )
.scorePlay()
+/*/

			})
		}
		this.domEditor.innerHTML = program
		this.colorize()


		//  Now that we have a program loaded into the editor
		//  we should evaluate it, eh? 

		this.eval()
	}
}




Beep.setupTasks.push( Beep.editor.setup.bind( Beep.editor ))







