function DateFromJulian(JDN) {
		var J = JDN+0.5;
		var j = J + 32044;
		var g = fdiv(j , 146097);
		var dg = fmod(j , 146097);
		var c = fdiv((fdiv(dg , 36524) + 1) * 3 , 4);
		var dc = dg - (c * 36524);
		var b = fdiv(dc , 1461);
		var db = fmod(dc , 1461);
		var a = fdiv((fdiv(db , 365) + 1) * 3 , 4);
		var da = db - (a * 365);
		var y = (g * 400) + (c * 100) + (b * 4) + a;
		var m = fdiv((da * 5 + 308) , 153) - 2;
		var d = da - fdiv((m + 4) * 153 , 5) + 122;
		var Y = y - 4800 + fdiv((m + 2), 12);
		var Mo = fmod((m + 2) , 12) + 1;
		var D = d + 1;
		
		var z = (JDN - Math.floor(JDN) + 0.000001) * 24.0 + 12;
		var HH = Math.floor(z);
		z = (z - HH) * 60.0;
		var MM = Math.floor(z);
		z = (z - MM) * 60.0;
		var SS = Math.floor(z);
		
//		var t=J-Math.floor(J);
//		var HH=fmod(24*t+12, 24);
//		t=fdiv(24*t+12, 24);
//		var MM=fmod(60*t, 60);
//		t=fdiv(60*t, 60);
//		var SS=fmod(60*t, 60);
//		t=fdiv(60*t, 60);
//		var MS=fmod(1000*t, 1000);
//		t=fdiv(1000*t, 1000);
		var date=new Date(Y, Mo-1, D, HH, MM, SS, 00);

		return date;
}

function JulianFromDate(date) {
	h = date.getHours();
	min = date.getMinutes();
	s = date.getSeconds();
	y = date.getFullYear();
	m = date.getMonth();
	d = date.getDate();
	m -= 2;
	if (m < 0) {
		m += 12;
		y--;
	}
	var jd = Math.floor(y * 365.25) + Math.floor(m * 30.6 + 0.5) + d + 1721117;
	if (jd > 2299170) {
		jd -= Math.floor(y / 100) - Math.floor(y / 400) - 2;
	}
	return jd + h / 24.0 + min / 1440.0 + s / 86400.0;
}


function fmod(a,b) {
	//return a/b - Math.floor(a/b);
	return a%b;
}
function fdiv(a,b) {
	return Math.floor(Math.floor(a)/Math.floor(b));
	//return a/b;
}

function log10(val) {
  return Math.log(val) / Math.LN10;
}