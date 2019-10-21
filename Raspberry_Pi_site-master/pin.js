var pin = anime({
	targets: '#pins .pin',
	strokeDashoffset: [anime.setDashoffset, 0],
	autoplay:true,
	scale: [0, 1],
	rotate: -45,
	
	easing:'easeOutExpo',
	// opacity:[0,1],
	delay: anime.stagger(250, {start: 100}),
	// delay: 0
});

var pin = document.getElementById('pins');
pin.addEventListener('click',function(){
	anime({
		targets: '#pin1',
		backgroundColor: 'rgb(255, 0, 0)',
		color: 'rgb(255, 0, 0)',
		duration: 0,

	})

	anime({
		targets: '#pin2',
		backgroundColor: 'rgb(255, 0, 0)',
		color: 'rgb(255, 0, 0)',
		duration: 500,
	})

	anime({
		targets: '#pin3',
		backgroundColor: 'rgb(255, 0, 0)',
		color: 'rgb(255, 0, 0)',
		duration: 1050,
	})
});



