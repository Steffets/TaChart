
// ----------------------------------------------------------------------
function TaChart(parent, param) {
	this.url = 'data.jsn';
	//this.url = '/rest/chart/data';
	this.urlTick;
	this.param = param;
	this.jsnData;
	this.mainAxisX;
	this.axisShare;
	this.axisVolume;
	this.axisScore;
	this.width = $('#'+parent).width();
	this.height = $('#'+parent).height();
	this.forecast;
	// - init properties
	this.mainMax;
	this.mainMin;
	this.showScore = param.showScore?true:false;
	// -- properties
	this.showVolume = false;
	this.mergeVolume = true;
	this.mergedVolumeHeight = 50;
	this.scoreHeight = 50;
	this.xAxisHeight = 20;
	this.extraWindowHeight = 50;
	this.extraWindowSize=0;
};

function getRandomNumber(value) {
	var num = Math.random()*15;
	num *= Math.floor(Math.random()*2) == 1 ? 1 : -1;
	var v =  value + num;
	return v;
}

TaChart.prototype.updateTest = function() {
	var path = $('.share-line')[0];
	var segments = path.pathSegList;
	var len=segments.numberOfItems;
	var v = getRandomNumber(segments.getItem(len-1).y);
	var redrawAxis = false;
	var m = this.axisShare.getMeasurementClone();
	// make this global over all update values
		if(this.axisShare.measurement.getRealValue(v) > this.mainMax) {
			this.mainMax = this.axisShare.measurement.getRealValue(v);
			redrawAxis = true;
		} else if(this.axisShare.measurement.getRealValue(v) < this.mainMin) {
			this.mainMin = this.axisShare.measurement.getRealValue(v);
			redrawAxis = true;
		} 
	// ---
	if(redrawAxis) {
		this.axisShare.changeMinMax(this.mainMin,this.mainMax);
		var yAxis = this.axisShare.render();
		$('#axisShare').replaceWith(yAxis);
	}
	var valuesG = new Array();
	valuesG.push(m.getRealValue(v));
	this.updateGraph('share',valuesG,m);
	// band
	path = $('#bollingerband-band')[0];
	segments = path.pathSegList;
	len=segments.numberOfItems/2;
	v = getRandomNumber(segments.getItem(len-1).y);
	var bu = new Array();
	bu.push(m.getRealValue(getRandomNumber(v)));
	v = getRandomNumber(segments.getItem(len+1).y);
	var bd = new Array();
	bd.push(m.getRealValue(getRandomNumber(v)));
	this.updateGraphBand('bollingerband',bu,bd,m);
}

TaChart.prototype.init = function() {
	var taChart = this;
	if(this.param.url) {
		this.url = this.param.url;
		this.urlTick = this.url+'/current';
	}
	$.getJSON(this.url, this.param , function(data) {
		taChart.jsnData = localData;
		taChart.mainMax = taChart.jsnData.extremData.max;
		taChart.mainMin = taChart.jsnData.extremData.min;
		taChart.draw();
	});
};
TaChart.prototype.draw = function(animate) {
	if(this.param.url) {
		this.url = this.param.url;
	}
	 var taChart = this;
	 taChart.forecast = taChart.jsnData.forecast;
	 taChart.mainAxisX = new DateAxis('main',{date:taChart.jsnData.shareData.date});
	 var xAxis = taChart.mainAxisX.render();
	 if(taChart.mergeVolume) {
		
		var offset = taChart.xAxisHeight+5+(taChart.extraWindowSize*(taChart.extraWindowHeight+5));
		if(taChart.showVolume) {
			offset += taChart.mergedVolumeHeight;
		}
		if(taChart.showScore) {
			offset += taChart.scoreHeight+5;
		}
		taChart.axisShare = new YAxis('main','axisShare',offset,taChart.mainMin,taChart.mainMax,taChart.jsnData.typeAxis);
		if(taChart.showScore) {
			offset -= taChart.scoreHeight+5;
			taChart.axisScore = new YAxis('main','axisScore',offset,-8, 8,'linear',taChart.scoreHeight);
			taChart.axisScore.className = 'axisScore';
			taChart.axisScore.raster = 4;
			taChart.axisScore.axisMode = 1;
			taChart.axisScore.fixedDecimal = 0;
		}
		if(taChart.showVolume) {
			offset -= taChart.mergedVolumeHeight+5;
			taChart.axisVolume = new YAxis('main','axisVolume',offset,taChart.jsnData.extremDataVolume.min, taChart.jsnData.extremDataVolume.max,'linear',taChart.mergedVolumeHeight);
			taChart.axisVolume.className = 'axisVolume';
			taChart.axisVolume.raster = 5;
			if(taChart.jsnData.extremDataVolume.max > 1000) {
				taChart.axisVolume.scale = 0.001;
			}
		}
	 } else {
		taChart.axisShare = new YAxis('main','axisShare',20,taChart.jsnData.extremData.min,taChart.jsnData.extremData.max,taChart.jsnData.typeAxis);
	 }
	 var yAxis = taChart.axisShare.render();
	 $('#main').append(xAxis);
	 $('#main').append(yAxis);
	 if(taChart.showVolume) {
		var volumeAxis = taChart.axisVolume.render();
		$('#main').append(volumeAxis);
		var volume = taChart.renderVolume("volume",taChart.mainAxisX, taChart.axisVolume,taChart.jsnData.shareData,0);
		$('#main').append(volume);
	 }
	 var share = taChart.renderGraph("share",taChart.mainAxisX, taChart.axisShare,taChart.jsnData.shareData.close,0);
	 $('#main').append(share);
	 if(taChart.showScore) {
		$('#main').append(taChart.axisScore.render());
		var score = taChart.renderScore("score",taChart.mainAxisX, taChart.axisScore,0);
		 $('#main').append(score);
	 }
	 // render additional charts
	 taChart.createAdditionalGraphs();
	 // the cross, always the last but before the chart label
	 var cross = createSVG('g',{id:'cross'});
	 $('#main').append(cross);
	 // draw chartLabel
	 taChart.drawChartLabel($('#main'));
	 // additional things
	 if(animate) {
		taChart.simulatePathDrawing();
		new Cross(taChart);
	 }
	 //
};
TaChart.prototype.clean = function() {
	$('#main g:not(.init), #main path:not(.init)').remove();
};
TaChart.prototype.createAdditionalGraphs = function() {
	for(var i=0; i<this.jsnData.graphData.length; i++) {
			var graph = this.jsnData.graphData[i];
			var type = graph.indicator.type;
			var window = graph.window;
			if(window == 0) {
				if(graph.indicator.name=="BollingerBand" || graph.indicator.name=="Renko") {
					console.log(graph.indicator.name);
					var bb = this.renderGraphBand(graph.indicator.name.toLowerCase(),this.mainAxisX, this.axisShare, graph.indicator.cdata.outRealUpperBand, graph.indicator.cdata.outRealLowerBand,graph.indicator.cdata.index,graph.indicator.cdata.forecast);
					$('#main').append(bb);
				} else if(graph.indicator.name=="Ichimoku") {
					var ichi = this.renderIchimoku(graph.indicator.name.toLowerCase(),this.mainAxisX, this.axisShare, graph.indicator.cdata, graph.indicator.cdata.index,graph.indicator.cdata.forecast);
					$('#main').append(ichi);
				} else {
					if(type=="chart") {
						console.log(graph.indicator.name);
						var graph = this.renderGraph(graph.indicator.name.toLowerCase(),this.mainAxisX, this.axisShare,graph.indicator.cdata.data,graph.indicator.cdata.index,graph.indicator.cdata.forecast);
						$('#main').append(graph);
					} else if(type=="signal") {
						
					}
				}
			} else {
				alert(window);
			}
		}
};
TaChart.prototype.renderGraph = function(name,axisX,axisY,values,index,forecast) {
	var fc = this.forecast;
	if(forecast) {
		fc = this.forecast-forecast;
	}
	var chartIndex = index;
	var z = chartIndex;
	var path='M '+axisX.measurement.getValue(z)+','+axisY.getValue(values[z-index]);
	for(z+1; z<this.jsnData.shareData.date.length-fc; z++) {
		path +=" L "+axisX.measurement.getValue(z)+','+axisY.getValue(values[z-index]);
	}
	return createSVG('path', {id:name+'-path', class:name+'-line',d:path});
};
TaChart.prototype.renderVolume = function(name,axisX,axisY,values,index) {
	var fc = this.forecast;
	var volume = createSVG('g');
	var path;
	var changed = true;
	var changeState = 0;
	var color;
	for(var z=index; z<this.jsnData.shareData.date.length-fc; z++) {
		var y = axisY.getValue(values.volume[z-index]);
		if(z==index) {
			path =" M "+axisX.measurement.getValue(z)+','+y;
		} else {
			path +=' L '+axisX.measurement.getValue(z)+','+y;
		}
		if(values.open[z-index]-values.close[z-index]<0) {
			volume.appendChild(createSVG('path', {class:name+'-green',d:'M '+axisX.measurement.getValue(z)+','+(axisY.getY0()-1)+' L '+axisX.measurement.getValue(z)+','+y}));
		} else {
			volume.appendChild(createSVG('path', {class:name+'-red',d:'M '+axisX.measurement.getValue(z)+','+(axisY.getY0()-1)+' L '+axisX.measurement.getValue(z)+','+y}));
		}
	}
	volume.appendChild(createSVG('path', {class:name+'-line',d:path}));
	return volume;
};
TaChart.prototype.renderScore = function(name,axisX,axisY,index) {
	var fc = this.forecast;
	var scoreElement = createSVG('g');
	var path;
	for(var z=index; z<this.jsnData.shareData.date.length-fc; z++) {
		var x = axisX.measurement.getValue(z);
		var scoreTotal = 0;
		for(var i=0; i<this.jsnData.scoringData.length; i++) {
			if( this.jsnData.scoringData[i].data.length > z) {
				var score = this.jsnData.scoringData[i].data[z].score;
				scoreTotal+=score;
			}
		}
		if(scoreTotal >=0) {						
			//ctx.fillStyle = "rgba(0,100,0, 1)";
		} else {
			//ctx.fillStyle = "rgba(100,0,0, 1)";
		}
		var y = axisY.getValue(scoreTotal);
		if(z==index) {
			path =" M "+axisX.measurement.getValue(z)+','+y;
		} else {
			path +=' L '+axisX.measurement.getValue(z)+','+y;
		}
	}
	scoreElement.appendChild(createSVG('path', {id:name+'-path',class:name+'-line',d:path}));
	return scoreElement;
}
// chartLabel
TaChart.prototype.drawChartLabel = function(svg) {
	var g = createSVG('g');
	var label = createSVG('text', {class:'chartlabel-text',x:4,y:20});
	var value = this.jsnData.symbol+"@1"+this.jsnData.timeUnit;	
	label.appendChild(document.createTextNode(value));
	g.appendChild(label);
	svg.append(g);
	var bBox = label.getBBox();
	var rect = createSVG('rect', {class:'chartlabel-rect',x:bBox.x-2,y:bBox.y,width:bBox.width+4,height:bBox.height});
	g.insertBefore(rect,label);
	//fitText(label,60,20);
};
// ------ extra graphs
TaChart.prototype.renderGraphBand = function(name,axisX,axisY,valuesUp,valuesDown,index,forecast) {
	var fc = this.forecast;
	if(forecast) {
		fc = this.forecast-forecast;
	}
	var len = this.jsnData.shareData.date.length-fc;
	var path1 =' M '+axisX.measurement.getValue(index)+','+axisY.getValue(valuesUp[index]);
	var path2 =' L '+axisX.measurement.getValue(index)+','+axisY.getValue(valuesDown[index]);
	for(var z=index+1; z< len; z++) {
		path1 +=' L '+axisX.measurement.getValue(z)+','+axisY.getValue(valuesUp[z-index]);
		path2 =' L '+axisX.measurement.getValue(z)+','+axisY.getValue(valuesDown[z-index])+path2;
	}
	path2 += ' Z ';
	var band = createSVG('g');
	p = createSVG('path', {id:name+'-band',class:name+'-band',d:path1+path2});
	band.appendChild(p);
	return band;
};
// --- ichimoku
TaChart.prototype.renderIchimoku = function(name,axisX,axisY,cdata,index,forecast) {
	var fc = this.forecast;
	if(forecast) {
		fc = this.forecast-forecast;
	}
	var ichi = createSVG('g');
	var pathSenkouA;
	var pathSenkouB;
	var changed = true;
	var changeState = 0;
	var state;
	var chartIndex = index;
	for(var z=chartIndex; z<this.jsnData.shareData.date.length-1-fc; z++) {
		if(cdata.senkouA[z] != 0) {
			if(changed) {
				pathSenkouA = " M ";
				pathSenkouB = ' Z';
			} else {
				pathSenkouA +=' L ';
			}
			changed = false;
			state = changeState;
			pathSenkouA +=axisX.measurement.getValue(z)+','+axisY.getValue(cdata.senkouA[z]);
			pathSenkouB =' L '+axisX.measurement.getValue(z)+','+axisY.getValue(cdata.senkouB[z])+pathSenkouB;
			if(cdata.senkouA[z] == cdata.senkouB[z]) {
				changed = !(changeState & 4);
				changeState = 4;
			} else {
				if(cdata.senkouA[z] > cdata.senkouB[z]) {
					changed = !(changeState & 1);
					changeState = 1;
				} else {
					changed = !(changeState & 2);
					changeState = 2;
				}
			}
			if(changed) {
				ichi.appendChild(createSVG('path', {class:name+'-band-'+state,d:pathSenkouA+pathSenkouB}));
			}
		}
	}
	ichi.appendChild(createSVG('path', {class:name+'-band-'+state,d:pathSenkouA+pathSenkouB}));
	return ichi;
};
// Animation
TaChart.prototype.simulatePathDrawing = function() {
  $('#main > path').each(function(idx, item){
	  var path = item;
	  var length = path.getTotalLength();
	  // Clear any previous transition
	  path.style.transition = path.style.WebkitTransition = 'none';
	  // Set up the starting positions
	  path.style.strokeDasharray = length + ' ' + length;
	  path.style.strokeDashoffset = length;
	  // Trigger a layout so styles are calculated & the browser
	  // picks up the starting position before animating
	  path.getBoundingClientRect();
	  // Define our transition
	  path.style.transition = path.style.WebkitTransition = 'stroke-dashoffset 1.5s ease-in-out';
	  // Go!
	  path.style.strokeDashoffset = '0';
  });
 };
// -- Updates
TaChart.prototype.updateTick = function() {
	var taChart = this;
	$.getJSON(this.urlTick, this.param , function(data) {
		var path = $('#share-path')[0];
		if(path) {
			var segments = path.pathSegList;
			var len=segments.numberOfItems;
			var sl = segments.getItem(len-1);
			sl.y = taChart.axisShare.getValue(data.ask);
		}
	});
};

TaChart.prototype.update = function() {
	var taChart = this;
	var p = this.param
	p.upDate=this.jsnData.shareData.date[this.jsnData.shareData.date.length-1-this.forecast];
	$.getJSON(this.url, p , function(data) {
		taChart.jsnData = data;
		var redrawAxis = false;
		var m = taChart.axisShare.getMeasurementClone();
		if(taChart.jsnData.extremData.max > taChart.mainMax) {
			taChart.mainMax = taChart.jsnData.extremData.max;
			redrawAxis = true;
		} else if(taChart.jsnData.extremData.min < taChart.mainMin) {
			taChart.mainMin = taChart.jsnData.extremData.min;
			redrawAxis = true;
		} 
		if(redrawAxis) {
			taChart.axisShare.changeMinMax(taChart.mainMin,taChart.mainMax);
			var yAxis = taChart.axisShare.render();
			$('#axisShare').replaceWith(yAxis);
		}
		//share
		taChart.updateGraph('share',taChart.jsnData.shareData.close,m);
		// score
		if(taChart.showScore) {
			taChart.updateScore('score',taChart.jsnData.scoringData,taChart.axisScore);
		 }
		// additional graphs
		for(var i=0; i<taChart.jsnData.graphData.length; i++) {
			var graph = taChart.jsnData.graphData[i];
			var type = graph.indicator.type;
			var window = graph.window;
			if(window == 0) {
				if(graph.indicator.name=="BollingerBand") {
					taChart.updateGraphBand(graph.indicator.name.toLowerCase(),graph.indicator.cdata.outRealUpperBand, graph.indicator.cdata.outRealLowerBand,m);
				} else if(graph.indicator.name=="Ichimoku") {
					// todo
				} else {
					if(type=="chart") {
						taChart.updateGraph(graph.indicator.name.toLowerCase(),graph.indicator.cdata.data,m);
					} else if(type=="signal") {
						// todo
					}
				}
			} else {
				alert(window);
			}
		}
	});

};
TaChart.prototype.updateGraph = function(name,values, oldMeasurement) {
	var path = $('#'+name+'-path')[0];
	var segments = path.pathSegList;
	var len=segments.numberOfItems;
	var size = values.length;
	for (var i=0;i<len-size;i++){
		var s0 = segments.getItem(i);
		var s1 = segments.getItem(i+size);
		var realY1 = oldMeasurement.getRealValue(s1.y);
		s0.y = this.axisShare.getValue(realY1);
	}
	var index = 0;
	for (var i=len-size;i<len;i++){
	//	console.log(len+","+size+","+i);
		var sl = segments.getItem(i);
		sl.y = this.axisShare.getValue(values[index++]);
	}
};
TaChart.prototype.updateScore = function(name,values, oldAxis) {
	var path = $('#'+name+'-path')[0];
	var segments = path.pathSegList;
	var len=segments.numberOfItems;
	var size = values[0].data.length;
	for (var i=0;i<len-size;i++){
		var s0 = segments.getItem(i);
		var s1 = segments.getItem(i+size);
		var realY1 = oldAxis.getRealValue(s1.y);
		s0.y = this.axisScore.getValue(realY1);
	}
	var index = 0;
	for (var z=len-size;z<len;z++){
	//	console.log(len+","+size+","+z);
		var sl = segments.getItem(z);
		var scoreTotal = 0;
		for(var i=0; i<values.length; i++) {
			if( values[i].data.length >= size) {
				var score = values[i].data[index].score;
				scoreTotal+=score;
			}
		}
		index +=1;
		sl.y = this.axisScore.getValue(scoreTotal);
	}
};
TaChart.prototype.updateGraphBand = function(name,valuesUp,valuesDown,oldMeasurement) {
	var path = $('#'+name+'-band')[0];
	var segments = path.pathSegList;
	var len=segments.numberOfItems;
	var size = valuesUp.length;
	var half = Math.floor((len-size)/2);
	for (var i=0;i<half;i++){
		var s0 = segments.getItem(i);
		var s1 = segments.getItem(i+size);
		var realY1 = oldMeasurement.getRealValue(s1.y);	
		s0.y = this.axisShare.getValue(realY1);		
		
		s0 = segments.getItem(len-1-i);
		s1 = segments.getItem(len-2-i);
		realY1 = oldMeasurement.getRealValue(s1.y);	
		s0.y = this.axisShare.getValue(realY1);				
	}
	var index = 0;
	for (var i=half-size;i<half;i++){
		var sl = segments.getItem(i);
		sl.y = this.axisShare.getValue(valuesUp[index]);
		sl = segments.getItem(half+size-index);
		sl.y = this.axisShare.getValue(valuesDown[index]);
		index += 1;
	}
};












 
 // ------------------------------------------------------
 function Cross(taChart) {
	this.taChart = taChart;
	this.offset = $('#svg').offset();
	this.cross = createSVG('g');
	this.crossV;
	this.crossVLabel;
	this.crossH;
	this.mouseX = 0;
	this.mouseY = 0;
	this.init();
 };
 
 Cross.prototype.init = function() {
		$('#cross').append(this.cross);	
		var cross = this;
				
		$('#main').mousemove(function(event){
			cross.mouseX = event.pageX - cross.offset.left;
			cross.mouseY = event.pageY - cross.offset.top;
			cross.draw();
		});
		$('#main').mouseout(function(event){
			//cross.crossV.style.visibility = 'hidden';
		});
		$('#main').mouseenter(function(event){
			//cross.crossV.style.visibility = 'visible';
			//cross.draw();
		});
		$('#main').mouseover(function(event){
			
		});
		
		
};
Cross.prototype.draw = function() {
		try {
				this.crossV.style.visibility = 'hidden';
				this.crossH.style.visibility = 'hidden';
				this.crossVLabel.style.visibility = 'hidden';
				//this.cross.removeChild(this.crossV);
				//this.cross.removeChild(this.crossH);
		} catch(e) {
			//console.log(e);
		}
		var x = Math.round(this.mouseX);
		var y = Math.round(this.mouseY);
		if(x > 0 && x < this.taChart.mainAxisX.getX1() && y < this.taChart.axisShare.getY0()) {
			//console.log(x);
			this.crossV = createSVG('line', {stroke: 'red',x1:x,y1:this.taChart.axisVolume.getY0()+3,x2:x,y2:this.taChart.axisShare.getY1()});
			// create V-Label
			this.crossVLabel = this.taChart.axisShare.renderLabel({y:y,border:true});
			this.cross.appendChild(this.crossVLabel);
			this.cross.appendChild(this.crossV);
			this.crossH = createSVG('line', {stroke: 'red',x1:this.taChart.mainAxisX.getX0(),y1:y,x2:this.taChart.mainAxisX.getX1()+3,y2:y});
			this.cross.appendChild(this.crossH);	
		}
};
Cross.prototype.drawTest = function() {
		var index = Math.round(this.taChart.mainAxisX.measurement.getRealValue(this.mouseX));
		try {
				this.crossV.style.visibility = 'hidden';
				this.crossH.style.visibility = 'hidden';
				this.crossVLabel.style.visibility = 'hidden';
				//this.cross.removeChild(this.crossV);
				//this.cross.removeChild(this.crossH);
			} catch(e) {
				console.log(e);
			}
		if(index > 0 && index < this.taChart.jsnData.shareData.close.length-1) {
			var x = this.taChart.mainAxisX.measurement.getValue(index);
			var val = this.taChart.jsnData.shareData.close[index];
			var dval = this.taChart.axisShare.measurement.getValue(val);	
			this.crossV = createSVG('line', {stroke: 'red',x1:x,y1:this.taChart.mainAxisX.getY0(),x2:x,y2:dval});
			// create V-Label
			this.crossVLabel = createSVG('g');
			var crossVLabelText = createSVG('text', {class:'crossVLabel-text',x:x,y:dval-5});
			var textNode = document.createTextNode(val);
			crossVLabelText.appendChild(textNode);
			this.crossVLabel.appendChild(crossVLabelText);
			this.cross.appendChild(this.crossVLabel);
			this.cross.appendChild(this.crossV);
			
			
			var crossVLabelRect = createSVG('rect', {class:'crossVLabel-rect',x:x-15,y:dval-25,width:30,height:20});
			this.crossVLabel.appendChild(crossVLabelRect);
			
			
			
			//fitText(crossVLabelText,26,16);
			
			
			this.crossH = createSVG('line', {stroke: 'red',x1:this.taChart.mainAxisX.getX0(),y1:this.mouseY,x2:this.taChart.mainAxisX.getX1(),y2:this.mouseY});
			this.cross.appendChild(this.crossH);	
		}
};

