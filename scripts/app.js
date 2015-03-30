



document.addEventListener( 'DOMContentLoaded', function(){


	//  Why not play this in distraction-free mode, eh?

	function goFullscreen(){

		var el = document.getElementById( 'fullscreen-container' )

		if( el.requestFullscreen ) el.requestFullscreen()
		else if( el.msRequestFullscreen ) el.msRequestFullscreen()
		else if( el.mozRequestFullScreen ) el.mozRequestFullScreen()
		else if( el.webkitRequestFullscreen ) el.webkitRequestFullscreen()
	}
	document.getElementById( 'fullscreen' ).addEventListener( 'click', goFullscreen )


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
	makeSocial( 'twitter',  500, 300, 'https://twitter.com/share?text='+ escape( 'Browser Synth by @stewd_io:' ) +'&url=' + escape( 'http://stewd.io/beep' ))
	makeSocial( 'facebook', 400, 300, 'https://www.facebook.com/sharer/sharer.php?u='+ escape( 'http://stewd.io/beep' ))
	// makeSocial( 'gplus',    400, 600, 'https://plus.google.com/share?url='+ escape( 'http://stewd.io/synth' ))
	// makeSocial( 'tumblr',   400, 400, 'http://www.tumblr.com/share?v=3&u='+ escape( 'http://stewd.io/synth' ) +'&t='+ escape( 'Browser Synth' ))
	// makeSocial( 'email',    400, 300, 'mailto:?Subject='+ escape( 'Browser Synth' ) +'&Body='+ escape( 'http://stewd.io/synth' ))
})







