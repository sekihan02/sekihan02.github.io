var clock = anime({
	targets: '#DateTime',
	strokeDashoffset: [anime.setDashoffset, 0],
	autoplay:true,

	translateY:[-700, 0],
	translateX:[-390, 0],

	scale: [0, 1],
	elaticity: 200,

	dulation: 2400,
	delay: 250
});