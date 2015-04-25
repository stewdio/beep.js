



document.addEventListener( 'DOMContentLoaded', function(){

	var 
	fullscreenToggleButton = document.getElementById( 'fullscreen-toggle' ),
	fullscreenEnabled = 
		document.fullscreenEnabled || 
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled

	function fullscreenToggle(){

		var 
		fullscreenElement = 
			document.fullscreenElement || 
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement,
		el = document.getElementById( 'fullscreen-container' )
		
		if( fullscreenElement ){
			
			if( document.exitFullscreen ) document.exitFullscreen()
			else if( document.webkitExitFullscreen ) document.webkitExitFullscreen()
			else if( document.mozCancelFullScreen ) document.mozCancelFullScreen()
			else if( document.msExitFullscreen ) document.msExitFullscreen()
		}
		else {

			if( el.requestFullscreen ) el.requestFullscreen()
			else if( el.msRequestFullscreen ) el.msRequestFullscreen()
			else if( el.mozRequestFullScreen ) el.mozRequestFullScreen()
			else if( el.webkitRequestFullscreen ) el.webkitRequestFullscreen()
		}
	}
	if( fullscreenEnabled ){

		fullscreenToggleButton.addEventListener( 'click', fullscreenToggle )
		fullscreenToggleButton.addEventListener( 'mouseenter', function(){

			this.setAttribute( 'src', 'demo/demo.svg#fullscreen-hover' )
		})
		fullscreenToggleButton.addEventListener( 'mouseleave', function(){

			this.setAttribute( 'src', 'demo/demo.svg#fullscreen' )
		})
	}
	else fullscreenToggleButton.style.display = 'none' 


	//  Everyone’s doing this right?
	//  Am I supposed to do this too?
	//  Is that how one becomes…“cool” ??

	function makeSocial( id, width, height, url ){

		function go( e ){ window.open(
			
			url,
			id,
			'width='+ width +',height='+ height +',resizable=yes,scrollbars=yes,titlebar=yes,menubar=yes,location=yes'
		)}

		var el = document.getElementById( id )

		el.addEventListener( 'click', go )
		el.addEventListener( 'touchend', go )
	}
	makeSocial( 'github',   800, 600, 'https://github.com/stewdio/beep.js' )
	makeSocial( 'twitter',  500, 300, 'https://twitter.com/share?text='+ escape( '#BeepJS by @stewd_io is a JavaScript toolkit for making synthesizers:' ) +'&url=' + escape( 'http://beepjs.com' ))
	makeSocial( 'facebook', 400, 300, 'https://www.facebook.com/sharer/sharer.php?u='+ escape( 'http://beepjs.com' ))
	// makeSocial( 'gplus',    400, 600, 'https://plus.google.com/share?url='+ escape( 'http://beepjs.com' ))
	// makeSocial( 'tumblr',   400, 400, 'http://www.tumblr.com/share?v=3&u='+ escape( 'http://beepjs.com' ) +'&t='+ escape( 'Beep.js' ))
	// makeSocial( 'email',    400, 300, 'mailto:?Subject='+ escape( 'Beep.js' ) +'&Body='+ escape( 'http://beepjs.com' ))
})







