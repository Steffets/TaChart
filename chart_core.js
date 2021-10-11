function createSVG(tag, attrs) {
	var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
	for (var k in attrs) {
		el.setAttribute(k, attrs[k]);
	}
	return el;
};
function fitText(textNode, width, height) {
	var bb = textNode.getBBox();
    var widthTransform = width / bb.width;
    var heightTransform = height / bb.height;
    var value = widthTransform < heightTransform ? widthTransform : heightTransform;
	var tx = (-(bb.x+bb.width/2)*(value-1)); // center
	var ty = (-(bb.y+bb.height/2)*(value-1)); // center
	textNode.setAttribute("transform", "matrix("+value+", 0, 0, "+value+", "+0+","+0+")");
}
function nicenum(x, round) {
	var exp;  //exponent of x
	var f; //fractional part of x
	var nf; //nice, rounded fraction
	
	exp = Math.floor(log10(x));
	f = x/Math.pow(10., exp);
	if (round) {
		if (f < 1.5) {
			nf = 1.;
		} else if (f < 3.) {
			nf = 2.;
		} else if (f < 7.) {
			nf = 5.;
		} else {
			nf = 10.;
		}
	} else {
		if (f <= 1.) {
			nf = 1.;
		} else if (f <= 2.) {
			nf = 2.;
		} else if (f <= 5.) {
			nf = 5.;
		} else {
			nf = 10.;
		}
	}
	return nf*Math.pow(10., exp);
}

function getArea(path1, path2, options) {
	var path = createSVG('path', options);
	var segments1 = path1.pathSegList;
	var len=segments1.numberOfItems;
	for (var i=0;i<len;i++){
		path.pathSegList.appendItem(segments1.getItem(0));
	}
	var segments2 = path2.pathSegList;
	var len=segments2.numberOfItems;
	for (var i=0;i<len;i++){
		path.pathSegList.appendItem(segments2.getItem(0));
	}
	//path.pathSegList.appendItem(segments1.getItem(0));
	return path;
}
//-----------------------------------------------
function Measurement(range,low,high, type, mirror) {
//	console.log(range+"-"+high+"+"+low);
	this.high = high;
	this.low = low;
	this.range = range;
	this.m = 1.0; // measurement
	this.type = 'linear';
	this.mirror = false;
	if(mirror) {
		this.mirror = mirror;
	}
	if(type) {
		this.type = type;
	}
	this.calculateMeasurement();
};
Measurement.prototype.getValue =  function(val) {
//	console.log("val="+val+", low="+this.low+", high="+this.high+", m="+this.m);
	var calcValue;
	if(this.type == 'linear') {
		calcValue = (val-this.low)*this.m;
	} else {		
		calcValue = (Math.log(val)-Math.log(this.low))*this.m;
	}
	var v = calcValue;
	if(this.mirror) {
		v = this.range-calcValue;
	}
	return Math.round(v);
};	
Measurement.prototype.getRealValue =  function(val) {
	if(val==0) {
		return 0;
	}
	if(this.mirror) {
		val = this.range-val;
	}
	if(this.type == 'linear') {
		return val/this.m+this.low;		
	} else {
		return Math.pow(Math.E,val/this.m+Math.log(this.low));				
	}
};
Measurement.prototype.calculateMeasurement = function() {
	if(this.type == 'linear') {		
		this.m = (this.range)/(this.high-this.low);
	} else {
		this.m = (this.range)/(Math.log(this.high)-Math.log(this.low));		
	}
};
//-----------------------------------------------------------------------
function DateAxis(svgId, param) {
	 this.svgId = svgId;
	 this.paddingRight = 60;
	 this.paddingBottom = 20;
	 this.date = param.date;
	 this.y;
	 this.x0;
	 this.svgWidth;
	 this.svgHeight;
	 this.dateIndex = 0;
	 this.graphmin;
	 this.graphmax; //graph range min and max
	 this.d; //tick mark spacing
	 this.init(param);
	 
};
DateAxis.prototype.init = function(param) {
	this.svgWidth = $('#'+this.svgId).width();
	this.svgHeight = $('#'+this.svgId).height();
	if(param.dateIndex) {
	 	 this.dateIndex = param.dateIndex;
	}
	if(param.paddingRight) {
	 	 this.paddingRight = param.paddingRight;
	}
	this.x1 = this.svgWidth-this.paddingRight;
	this.y = this.svgHeight-this.paddingBottom;
	var min = this.date[this.dateIndex];
	var max = this.date[this.date.length-1];
	var ntick = 7;
	var range = nicenum(max - min, false);
	this.d = nicenum(range/(ntick - 1), true);
	this.graphmin = Math.floor(min/this.d)*this.d;
	this.graphmax = Math.ceil(max/this.d)*this.d;
	//console.log(this.graphmin+","+(this.graphmax + .5*this.d)+","+this.d+"--"+min+","+max);
	this.measurement = new Measurement(this.x1, this.graphmin,this.graphmax,null,false);
};


DateAxis.prototype.render = function() {
	this.measurement = new Measurement(this.x1, this.graphmin,this.graphmax,null,false);
	 var textSpace = 20;	 
	 var g = createSVG('g',{stroke: 'none', fill: 'none'});
	 g.appendChild(createSVG('path', {stroke: 'black',d:'M 0,'+this.y+'L '+this.x1+','+this.y}));
	 
	 var dummyTextSVG = document.getElementById('dummy-text');
	 var date = DateFromJulian(this.graphmin)
	 var dummyText = date.getDate()+"."+(date.getMonth()+1)+"."+date.getFullYear().toString().substring(2);
	 dummyTextSVG.textContent = dummyText;
	 var bbox = dummyTextSVG.getBBox();
	 var centerWidth = Math.round(bbox.width/2);	
	
	var nfrac;
	var x;	
	nfrac = Math.max( - Math.floor(log10(this.d)), 0); //number of fractional digits to show
	for (x = this.graphmin; x+this.d < this.graphmax + .5*this.d; x+= this.d) {
		var xGraph = this.measurement.getValue(x);
		g.appendChild(createSVG('path', {class:'dateAxis-grid',d:'M '+xGraph+',0 L '+xGraph+','+this.y}));
		if(x != this.graphmin) {
			var label = createSVG('text', {class:'dateAxis-text',x:xGraph-centerWidth,y:this.y+bbox.height});
			date = DateFromJulian(x);
			if((this.graphmax-this.graphmin) < 2) {
				label.appendChild(document.createTextNode(date.getHours()+":"+date.getMinutes()));			
			} else {
				label.appendChild(document.createTextNode(date.getDate()+"."+(date.getMonth()+1)+"."+date.getFullYear().toString().substring(2)));
			}
			g.appendChild(label);
		}
	}
	this.measurement = new Measurement(this.x1, this.dateIndex,this.date.length,null,false);
	return g;
};
DateAxis.prototype.getX0 = function() {
	return 0;
};
DateAxis.prototype.getX1 = function() {
	return this.measurement.range;
};
DateAxis.prototype.getY0 = function() {
	return this.taChart.height;
};
DateAxis.prototype.getY1 = function() {
	return this.y;
};
//**
//	offset = Distance from bottom 
//**
function YAxis(svgId, id, offset, min, max, type, height) {
	 this.svgId = svgId;
	 this.id = id;
	 this.paddingRight = 60;
	 this.offset = offset;
	 this.height = height;
	 this.svgHeight;
	 this.width;
	 this.min = min;
	 this.max = max;
	 this.measurement;
	 this.y0;
	 this.y1;
	 this.className = 'yAxis';
	 this.centerHeight;
	 this.scale = 1;
	 this.axisMode = 0; // Render labels: 0=auto, 1=manuell start+raster
	 this.graphmin;
	 this.graphmax; //graph range min and max
	 this.d; //tick mark spacing
	 
	 this.init();
	 
};
YAxis.prototype.init = function() {
	this.svgHeight = $('#'+this.svgId).height();
	if(!this.height) {
		this.height = this.svgHeight-this.offset;
	}
	this.width = $('#'+this.svgId).width();
	this.y0 = this.svgHeight-this.offset-this.height;
	this.y1 = this.svgHeight-this.offset;
	var ntick = 5;
	var range = nicenum(this.max - this.min, false);
	this.d = nicenum(range/(ntick - 1), true);
	this.graphmin = Math.floor(this.min/this.d)*this.d;
	this.graphmax = Math.ceil(this.max/this.d)*this.d;
	
	this.measurement = new Measurement(this.height, this.graphmin,this.graphmax,this.type,true);
};
YAxis.prototype.changeMinMax = function(min, max) {
	this.min = min;
	this.max = max;
	var ntick = 5;
	var range = nicenum(this.max - this.min, false);
	this.d = nicenum(range/(ntick - 1), true);
	this.graphmin = Math.floor(this.min/this.d)*this.d;
	this.graphmax = Math.ceil(this.max/this.d)*this.d;
	this.measurement = new Measurement(this.height, this.graphmin,this.graphmax,this.type,true);
};
YAxis.prototype.getMeasurementClone = function() {
	return new Measurement(this.height, this.graphmin,this.graphmax,this.type,true);
};
YAxis.prototype.render = function() {
	 var textSpace = 20;
	 var x1 = this.width-this.paddingRight;
	 var g = createSVG('g',{id:this.id, stroke: 'none', fill: 'none'});
	 //console.log(this.svgHeight+","+this.offset+","+y0+","+y1);
	 g.appendChild(createSVG('path', {stroke: 'black',d:'M '+x1+','+this.y0+' L '+x1+','+this.y1}));
	 //console.log("className:"+this.className);
	 var dummyTextSVG = document.getElementById('dummy-text');
	 dummyTextSVG.textContent = (this.measurement.getRealValue(1)*this.scale).toFixed(this.fixedDecimal);
	 this.bbox = dummyTextSVG.getBBox();
	 this.centerHeight = Math.round(this.bbox.height/4);
	 if(this.axisMode == 0) {
		var nfrac;
		var y;	
		nfrac = Math.max( - Math.floor(log10(this.d)), 0); //number of fractional digits to show
		var ymax = this.graphmax + .5*this.d;
		for (y = this.graphmin; y < ymax; y+= this.d) {
			var yGraph = this.measurement.getValue(y);
			g.appendChild(createSVG('path', {class:this.className+'-grid',d:'M 0,'+yGraph+' L '+x1+','+yGraph}));
			if(y != this.graphmin && y < ymax-this.d) {
				var label = createSVG('text', {class:this.className+'-text',x:x1+5,y:yGraph+this.centerHeight});
				var value = (y*this.scale).toFixed(nfrac);
				label.appendChild(document.createTextNode(value));
				g.appendChild(label);
			}
		}
	 } else {
	 	for(i=this.min+this.raster; i<=this.max-this.raster; i+=this.raster) {
	 		var y = this.y0+this.measurement.getValue(i);
			g.appendChild(createSVG('path', {class:this.className+'-grid',d:'M 0,'+y+' L '+x1+','+y}));
			var label = createSVG('text', {class:this.className+'-text',x:x1+5,y:y+this.centerHeight});
			var value = (i*this.scale).toFixed(this.fixedDecimal);
			label.appendChild(document.createTextNode(value));
			g.appendChild(label);
		 }
	 }
	 
	 return g;
};
YAxis.prototype.renderLabel = function(data) {
	var y = data.y;
	var x1 = this.width-this.paddingRight;
	var g = createSVG('g');
	var label = createSVG('text', {class:this.className+'-text',x:x1+5,y:y+this.centerHeight});
	var value = this.measurement.getRealValue(y-this.y0).toFixed(2);
	if(data.border == true) {
		var rect = createSVG('rect', {class:'crossVLabel-rect',x:x1+3,y:y-this.centerHeight-4,width:this.bbox.width+3,height:(this.bbox.height)/2+8});
		g.appendChild(rect);
	}
	label.appendChild(document.createTextNode(value));
	g.appendChild(label);
	return g;
};
YAxis.prototype.getValue = function(val) {
	return this.measurement.getValue(val)+this.y0;
};
YAxis.prototype.getRealValue = function(val) {
	return this.measurement.getRealValue(val-this.y0);
};
YAxis.prototype.getY0 = function() {
	return this.y1;
};
YAxis.prototype.getY1 = function() {
	return this.y0;
};

function XAxis(taChart) {
	 this.paddingRight = 30;
	 this.paddingBottom = 0;
	 this.taChart = taChart;
	 this.y;
	 this.measurement = new Measurement(this.taChart.width-this.paddingRight,0,this.taChart.jsnData.score.length-1,null,false);
};
XAxis.prototype.render = function() {
	 var textSpace = 20;
	 this.y = this.taChart.height-this.paddingBottom;
	 var x1 = this.taChart.width-this.paddingRight;
	 var g = createSVG('g',{stroke: 'none', fill: 'none'});
	 g.appendChild(createSVG('path', {stroke: 'black',d:'M 0,'+this.y+'L '+x1+','+this.y}));
	 var dummyTextSVG = document.getElementById('dummy-text');
	 var bbox = dummyTextSVG.getBBox();
	 var centerWidth = Math.round(bbox.width/2);
	 var countingTextTicks = this.measurement.range/(bbox.width+textSpace);
	 for(i=centerWidth; i<x1-textSpace; i+=bbox.width+textSpace) {
		//g.appendChild(createSVG('path', {class:'dateAxis-grid',d:'M '+i+',0 L '+i+','+this.y}));
		var label = createSVG('text', {class:'dateAxis-text',x:i-centerWidth,y:this.y+bbox.height});
		var index = Math.round(this.measurement.getRealValue(i));
		//var date = DateFromJulian(this.taChart.jsnData.shareData.date[index]);
		//label.appendChild(document.createTextNode(date.getDate()+"."+(date.getMonth()+1)+"."+date.getFullYear()));
		//g.appendChild(label);
	 }
	 return g;
};
XAxis.prototype.getX0 = function() {
	return 0;
};
XAxis.prototype.getX1 = function() {
	return this.measurement.range;
};
XAxis.prototype.getY0 = function() {
	return this.taChart.height;
};
XAxis.prototype.getY1 = function() {
	return this.y;
};