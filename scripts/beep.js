



var BEEP = {

	VERSION: 1,


	//  Chrome, Opera, and Firefox already provide AudioContext()
	//  but Safari instead provides webkitAudioContext().

	AudioContext: window.AudioContext ? window.AudioContext : window.webkitAudioContext

}