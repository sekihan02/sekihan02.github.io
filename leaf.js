var leaf = anime.timeline();

leaf
    // 2秒後1秒間アニメ
    .add({
        targets: '.leaf',
        duration: 1000,
        delay: 2000,
        opacity: [0, 1],
        rotate: [0, 5],
        rotateX: [-180, 50],
        rotateY: [0, -10],
        translateX: [-50, 0],

        translateY: [-50, -90],
		easing: "easeOutExpo",

    });