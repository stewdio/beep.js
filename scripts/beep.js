



var BEEP = {

	VERSION: 2,


	//  Chrome, Opera, and Firefox already provide AudioContext()
	//  but Safari instead provides webkitAudioContext().
	//  Let’s just standardize this for our own sanity right here:

	AudioContext: window.AudioContext ? window.AudioContext : window.webkitAudioContext,
}


//  We might as well create an instance of AudioContext
//  that we can re-use over and over if necessary.
//  Why? Because the number of AudioContext instance is
//  limited by hardware. For example, my personal laptop
//  can only handle 6 of them at once!

BEEP.audioContext = new BEEP.AudioContext()



