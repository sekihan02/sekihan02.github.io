/* 時計表示 */
function showClock() {
	var d=new Date();
	var y=d.getFullYear();			// 年を取得
	var mo=d.getMonth();			// 月を取得（0～11
	var day=d.getDate();			// 日を取得

	if(mo==2){
		if((y%4==0) && (y%100!=0) || (y%400==0)){
			daymax=29; 				// 閏年
		}else{
			daymax=28;
		}
	}else if(mo==4 || mo==6 || mo==9 || mo==11){
		daymax=30;
	}else{
		daymax=31;
	}
	y=timerFormat(y);
	mo=timerFormat(mo+1);
	day=timerFormat(day);

	var h=d.getHours();					// 時
	var m=d.getMinutes();				// 分
	var s=d.getSeconds();				// 秒
	m=timerFormat(m)
	s=timerFormat(s)
	document.getElementById('DateTime').innerHTML=y+"<br>"+mo+"/"+day+ "<br>" +h+":"+m+":"+s;
	timerID=setTimeout('showClock()',1000);
}
/* 書式フォーマット */
function timerFormat(n) {
	if (n<10){ n="0"+n; }
	return n;
}
/* ウィンドウが読み込まれたら処理を実行 */
window.onload=showClock;
// document.write(showClock.fontcolor("yellow"));