
/*

	This is just a rough first pass on an editor.
	Two bits are still contained in the main Beep.js file:
	
	Beep.isEditing
	Beep.eval()

	Seems logical to move those into here in a future revision
	and to also have this generate the DOM Elements required
	so you won’t have to add anything to your own HTML.

	Soon, soon!

*/




//  Help our simple editor support TABs and so on.
//  @@ This junk will get properly sorted in the near future,
//  perhaps moving all editing-related bits into a separate module.
//  You see I have to make it quick and messy and hacky first,
//  then clean, clean, clean!
//  @@ Test to see if we can reduce this code GREATLY by just inserting 
//  a real TAB character?!?!? \t for the win!
//  See also if( this === document.activeElement )...

function setupEditor(){


	//  Return the caret position of the Textarea.

	HTMLTextAreaElement.prototype.getCaretPosition = function (){
		
		return this.selectionStart
	}


	//  Change the caret position of the Textarea.
	
	HTMLTextAreaElement.prototype.setCaretPosition = function( caretPosition ){
	
		this.selectionStart = caretPosition
		this.selectionEnd   = caretPosition
		this.focus()
	}


	//  If the Textarea has selection then return true.

	HTMLTextAreaElement.prototype.hasSelection = function(){
		
		return !( this.selectionStart === this.selectionEnd )
	}


	//  Return the selection text.

	HTMLTextAreaElement.prototype.getSelectedText = function(){
		
		return this.value.substring( this.selectionStart, this.selectionEnd )
	}


	//  Change the selection area of the Textarea.

	HTMLTextAreaElement.prototype.setSelection = function( start, end ){
		
		this.selectionStart = start
		this.selectionEnd   = end
		this.focus()
	}


	//  Here’s our routine for tab support!
	//  We’ll pass this to some Event Listeners below...

	function tabSupport( event ){
		
		var 
		tab = '    ',
		newCaretPosition
		
		if( event.keyCode === 9 ){//  Tab.
			
			newCaretPosition = this.getCaretPosition() + tab.length
			this.value = 
				this.value.substring( 0, this.getCaretPosition() ) +
				tab +
				this.value.substring( this.getCaretPosition(), this.value.length )
			this.setCaretPosition( newCaretPosition )
			event.preventDefault()
		}
		else if( event.keyCode === 8 ){//  Backspace.
			
			if( this.value.substring( this.getCaretPosition() - tab.length, this.getCaretPosition()) === tab ){//  Backspacing over a tab.

				newCaretPosition = this.getCaretPosition() - tab.length + 1
				this.value = 
					this.value.substring( 0, this.getCaretPosition() - 3 ) +
					this.value.substring( this.getCaretPosition(), this.value.length )
				this.setCaretPosition( newCaretPosition )
			}
		}
		else if( event.keyCode === 37 ){//  Left arrow.
			
			if( this.value.substring( this.getCaretPosition() - tab.length, this.getCaretPosition()) === tab ){//  Arrow over a tab.
				
				newCaretPosition = this.getCaretPosition() - tab.length + 1
				this.setCaretPosition( newCaretPosition )
			}    
		}
		else if( event.keyCode === 39 ){//  Right arrow.

			if( this.value.substring( this.getCaretPosition() + tab.length, this.getCaretPosition()) === tab ){//  Arrow over a tab.
				
				newCaretPosition = this.getCaretPosition() + tab.length - 1
				this.setCaretPosition( newCaretPosition )
			}
		} 
	}


	//  Find all Textareas in this document
	//  and add our tabSupport routine to them.

	Array.prototype.slice.call( document.getElementsByTagName( 'textarea' )).forEach( function( textarea ){

		textarea.addEventListener( 'keydown', tabSupport )
		textarea.addEventListener( 'input', function(){

			var el = document.getElementById( 'eval-status' )
			
			el.classList.remove( 'good' )
			el.classList.remove( 'bad' )
			el.classList.add( 'ugly' )
		})
	})
}




document.addEventListener( 'DOMContentLoaded', function(){


	//  A very simple editor for warm and fuzzy Beep-ness.

	setupEditor()
	function editorToggle(){

		var el = document.getElementById( 'editor-container' )

		if( Beep.isEditing ){

			el.classList.remove( 'show' )
			Beep.isEditing = false
		}
		else {

			el.classList.add( 'show' )
			//el.getElementById( 'editor' ).focus()
			Beep.isEditing = true
		}
	}
	document.getElementById( 'editor-open' ).addEventListener( 'click', editorToggle )
	document.getElementById( 'editor-close' ).addEventListener( 'click', editorToggle )
	document.getElementById( 'editor-apply' ).addEventListener( 'click', Beep.reset.bind( Beep ))
})



