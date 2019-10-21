var ball = anime({
    targets: '#ball',
    strokeDashoffset: [anime.setDashoffset, 0],
    autoplay:true,

    // easing:'easeOutExpo',
    scale: [0, 1],
    rotate:[180, -25],
    elaticity: 400,


    dulation: 1600,
    delay: 600,
});


