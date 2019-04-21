
var cat = anime.timeline();

cat
    .add({
        targets: '#clipMask .cat',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing:'linear',
        autoplay:true,
        // duration:function(cat, k) {
        //     return 1500 + (k*60);
        // },
        duration: 2000,
        offset: function(cat, j) {
            return 100+(j*60);
        },
        delay: function(cat, i) {
            return 100 + (i * 150);
        },
        delay:0
        // opacity: [0, 1]
        // opacity:{value:[1,0],delay:function(cat, i) {
        //     return 1000 + (i * 150);
        // },}
    })
    // 鳥居の表示
    .add({
        targets: '.shrine',
        translateY: [500, 0],
        scaleX:[5, 1],
        scale:[0, 1],
        duration: 1750,
        delay:250,
        elasticity: 800,
        // easing:'easeOutQuint'
    });

// var animObj_1 = anime({
//     targets:'#a1',
//     strokeDashoffset: [anime.setDashoffset, 0],
//     easing:'linear',
//     autoplay:true,
//     duration:1000,
//     delay:0,
//     opacity:{value:[1,0],delay:6500}
// });
// var animObj_2 = anime({
//     targets:'#a33',
//     strokeDashoffset: [anime.setDashoffset, 0],
//     easing:'linear',
//     autoplay:true,
//     duration:900,
//     delay:2000,
//     opacity:{
//         value:[1,0],
//         delay:6500,
//         duration:2000
//     }
// });
// var animObj_3 = anime({
//     targets:'#a7',
//     strokeDashoffset: [anime.setDashoffset, 0],
//     easing:'easeInOutSine',
//     autoplay:true,
//     duration:4000,
//     delay:2200,
//     opacity: {
//         value:[1,0],
//         delay:6500,
//         duration:2000
//     }
// });
// var animObj_4 = anime({targets:'#a4',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:200,delay:6000,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_5 = anime({targets:'#a5',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:200,delay:6200,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_6 = anime({targets:'#a2',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_7 = anime({targets:'#a3',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_8 = anime({targets:'#a8',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_9 = anime({targets:'#a9',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_10 = anime({targets:'#a10',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_11 = anime({targets:'#a11',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_12 = anime({targets:'#a12',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
// autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_15 = anime({targets:'#a15',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_13 = anime({targets:'#a13',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_14 = anime({targets:'#a14',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_16 = anime({targets:'#a16',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_17 = anime({targets:'#a17',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_18 = anime({targets:'#a18',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_19 = anime({targets:'#a19',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_20 = anime({targets:'#a20',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_21 = anime({targets:'#a21',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_22 = anime({targets:'#a22',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_23 = anime({targets:'#a23',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_24 = anime({targets:'#a24',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_25 = anime({targets:'#a25',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_26 = anime({targets:'#a26',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_27 = anime({targets:'#a27',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_28 = anime({targets:'#a28',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_29 = anime({targets:'#a29',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_30 = anime({targets:'#a30',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_31 = anime({targets:'#a31',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_32 = anime({targets:'#a32',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_33 = anime({targets:'#a33',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_33 = anime({targets:'#a36',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_34 = anime({targets:'#a34',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_35 = anime({targets:'#a35',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });
// var animObj_36 = anime({targets:'#a6',strokeDashoffset: [anime.setDashoffset, 0],easing:'linear',
//    autoplay:true,duration:300,delay:6400,opacity:{value:[1,0],delay:6500,duration:2000}
// });