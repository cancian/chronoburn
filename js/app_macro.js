﻿//##/////////////////##//
//## GET FULLHISTORY ##//
//##/////////////////##//
function getFullHistory() {
	var fullArray   = [];
	var oldestEntry = new Date().getTime();
	var now         = new Date().getTime();
	var day         = 60*60*24*1000;
	var week        = day*7;
	var month       = day*30;
	var months      = ['January', 'February', 'March', 'April', 'May', 'June','July', 'August', 'September', 'October', 'November', 'December'];
	var monthName   = months[new Date().getMonth()];
	var todaysTime  = Date.parse(new Date(monthName + ' ' +  new Date().getDate() + ', ' + new Date().getFullYear()));
	/////////////////
	// GET ENTRIES //
	/////////////////
	getEntries(function(data) {
		for(var g=0, len=data.length; g<len; g++) {
			fullArray.push({ date: DayUtcFormat(parseInt(data[g].published)),val: data[g].title});
			//GET OLDEST
			if(oldestEntry > parseInt(data[g].published)) {
				oldestEntry = parseInt(data[g].published);
			}
		}
		//SORT
		fullArray = fullArray.sort(function(a, b) {
			return (a.date > b.date) ? 1 : ((a.date < b.date) ? -1 : 0);
		});
		// at least a week
		if(now - oldestEntry < week) {
			oldestEntry = now - week;
		}
		//at most a month
		if(now - oldestEntry > month) {
			//oldestEntry = now - month;
		}
		//MORE THAN A DAY
		//if(DayUtcFormat(now) != DayUtcFormat(oldestEntry)) {
		var countBack = todaysTime;
		var dayArray  = [];
		/////////////////////
		// DAY INJECT LOOP //
		/////////////////////
		while(oldestEntry-(day*1) < countBack) {
			var daySum = 0;
			//dump all day data in date array
			for(var h=0, hen=fullArray.length; h<hen; h++) {
				if(fullArray[h].date == DayUtcFormat(countBack)) {
					daySum = daySum + parseInt(fullArray[h].val);
				}
			}
			//insert
			dayArray.push([countBack,daySum]);
			//while
			countBack = countBack - day;
		}
		//////////////
		// HANDLERS //
		//////////////
		var appHistoryHandlers = function () {
			//#/////////////////////////#//
			//# REBUILD HISTORY SNIPPET #//
			//#/////////////////////////#//
			rebuildHistory = function () {
				////////////////
				// LOCAL DATE //
				////////////////
				Highcharts.setOptions({
					lang : {
						shortMonths : LANG.MONTH_SHORT[lang].split(', '),
						weekdays : LANG.WEEKDAY_SHORT[lang].split(', ')
					}
				});
				///////////////
				// MIN WIDTH //
				///////////////
				var minWidth = $('#appContent').width() / dayArray.length;
				if (minWidth < 20) {
					minWidth = 20;
				}
				if (minWidth > 100) {
					minWidth = 100;
				}
				minWidth = dayArray.length * minWidth;
				if (minWidth < $('#appContent').width()) {
					minWidth = $('#appContent').width();
				}
				////////////////
				// STATISTICS //
				////////////////
				var heightAdjust = $('body').hasClass('android2') ? 19 : 9;
				$('#appHistory').highcharts({
					chart : {
						reflow : false,
						spacingLeft : 0,
						spacingRight : 0,
						spacingTop : 0,
						spacingBottom : 9,
						height : $('#newWindow').height() - heightAdjust,
						width : minWidth
					},
					credits : {
						enabled : false
					},
					legend : {
						enabled : false
					},
					title : {
						text : ''
					},
					tooltip : {
						enabled : true
					},
					subtitle : {
						text : ''
					},
					yAxis : {
						title : {
							text : ''
						},
						//tickPositions : [lowerTick, midTick, upperTick],
						gridLineColor : 'rgba(0,0,0,.12)',
						//gridLineDashStyle : 'longdash',
						labels : {
							enabled : true,
							align : 'left',
							x : 2, //31,
							y : -1,
							textSize : '9px'
						},
						showFirstLabel : false,
						showLastLabel : false
					},
					xAxis : {
						type : 'datetime'
					},
					plotOptions : {
						series : {
							marker : {
								enabled : true,
								lineWidth : 2,
								lineColor : '#2F7ED8',
								fillColor : 'white',
								states : {
									hover : {
										lineWidth : 2
									}
								}
							},
							allowPointSelect : false,
							lineWidth : 2,
							states : {
								hover : {
									lineWidth : 2
								}
							}
						},
						line : {
							dataLabels : {
								enabled : false,
								style : {
									textShadow : '0 0 3px white',
									fontSize : '12px'
								},
								y : -9
							},
							enableMouseTracking : true
						}
					},
					series : [{
							type : 'area',
							name : LANG.KCAL[lang],
							animation : false,
							data : dayArray.sort()
						}
					]
				});
			};
			/////////////
			// EXECUTE //
			/////////////
			rebuildHistory();
		};
		//////////
		// HTML //
		//////////
		var appHistoryHtml = '<div id="appHistory"></div>';
		/////////////////
		// CALL WINDOW //
		/////////////////
		getNewWindow(LANG.STATISTICS[lang],appHistoryHtml,appHistoryHandlers);
	});
}
//##////////////////##//
//## INTAKE HISTORY ##//
//##////////////////##//
function intakeHistory() {
	//check exists
	if(!app.read('app_last_tab','tab1'))	{ return; }
	if(!$('#appStatusIntake').html())		{ return; } 
	if($('body').hasClass('closer')) {
		$('body').removeClass('closer');
		$('body').addClass('reCloser');
	}
	//if($('#appStatusIntake div').length === 0) { return; }
	//go
	var firstTick = 0;
	var lastTick  = app.read('config_kcals_day_0') * 1.5;
	var origTick  = app.read('config_kcals_day_0');
	/////////////////
	// CYCLIC CASE //
	/////////////////
	if(app.read('config_kcals_type','cyclic')) {
		if(app.read('config_kcals_day','d')) {
			lastTick = app.read('config_kcals_day_2') * 1.5;
			origTick = app.read('config_kcals_day_2');
		} else {
			lastTick = app.read('config_kcals_day_1') * 1.5;
			origTick = app.read('config_kcals_day_1');
		}
	}
	///////////////////////////////////////
	// localized short weekday countback //
	///////////////////////////////////////
	var day = 60 * 60 * 24 * 1000;
	var now = new Date().getTime();
	//count back 7 days
	var past0days = DayUtcFormat(now);
	var past1days = DayUtcFormat(now - (day*1));
	var past2days = DayUtcFormat(now - (day*2));
	var past3days = DayUtcFormat(now - (day*3));
	var past4days = DayUtcFormat(now - (day*4));
	var past5days = DayUtcFormat(now - (day*5));
	var past6days = DayUtcFormat(now - (day*6));
	var past7days = DayUtcFormat(now - (day*7));
	//weekday lang array
	var weekdaysArray = LANG.WEEKDAY_SHORT[lang].split(', ');
	//parse date as time
	var past0daysTime = Date.parse(DayUtcFormat(past0days));
	var past1daysTime = Date.parse(DayUtcFormat(past1days));
	var past2daysTime = Date.parse(DayUtcFormat(past2days));
	var past3daysTime = Date.parse(DayUtcFormat(past3days));
	var past4daysTime = Date.parse(DayUtcFormat(past4days));
	var past5daysTime = Date.parse(DayUtcFormat(past5days));
	var past6daysTime = Date.parse(DayUtcFormat(past6days));
	var past7daysTime = Date.parse(DayUtcFormat(past7days));
	//get weekday n. from time
	var past0daysNumber = (new Date(past0daysTime)).getDay();
	var past1daysNumber = (new Date(past1daysTime)).getDay();
	var past2daysNumber = (new Date(past2daysTime)).getDay();
	var past3daysNumber = (new Date(past3daysTime)).getDay();
	var past4daysNumber = (new Date(past4daysTime)).getDay();
	var past5daysNumber = (new Date(past5daysTime)).getDay();
	var past6daysNumber = (new Date(past6daysTime)).getDay();
	var past7daysNumber = (new Date(past7daysTime)).getDay();
	///////////////////////////
	// usable weekday labels //
	///////////////////////////
	var past0daysLabel = weekdaysArray[past0daysNumber];
	var past1daysLabel = weekdaysArray[past1daysNumber];
	var past2daysLabel = weekdaysArray[past2daysNumber];
	var past3daysLabel = weekdaysArray[past3daysNumber];
	var past4daysLabel = weekdaysArray[past4daysNumber];
	var past5daysLabel = weekdaysArray[past5daysNumber];
	var past6daysLabel = weekdaysArray[past6daysNumber];
	var past7daysLabel = weekdaysArray[past7daysNumber];
	//////////////////////
	// WEEKDAY SUM LOOP //
	//////////////////////
	//sum vars
	var past0daysSum = 0;
	var past1daysSum = 0;
	var past2daysSum = 0;
	var past3daysSum = 0;
	var past4daysSum = 0;
	var past5daysSum = 0;
	var past6daysSum = 0;
	var past7daysSum = 0;
	//LOOP
	getEntries(function(data) {
		var dataPublished;
		var dataTitle;
		for(var i=0, len=data.length; i<len; i++) {
			dataPublished = DayUtcFormat(parseInt(data[i].published));
			dataTitle     = parseInt(data[i].title);
			if(dataPublished == past0days) { past0daysSum = past0daysSum + dataTitle; }
			if(dataPublished == past1days) { past1daysSum = past1daysSum + dataTitle; }
			if(dataPublished == past2days) { past2daysSum = past2daysSum + dataTitle; }
			if(dataPublished == past3days) { past3daysSum = past3daysSum + dataTitle; }
			if(dataPublished == past4days) { past4daysSum = past4daysSum + dataTitle; }
			if(dataPublished == past5days) { past5daysSum = past5daysSum + dataTitle; }
			if(dataPublished == past6days) { past6daysSum = past6daysSum + dataTitle; }
			if(dataPublished == past7days) { past7daysSum = past7daysSum + dataTitle; }
			//reset
			dataPublished = 0;
			dataTitle     = 0;
		}
		//null for zero
		//if(past0daysSum == 0) { past0daysSum = null; }
		//if(past1daysSum == 0) { past1daysSum = null; }
		//if(past2daysSum == 0) { past2daysSum = null; }
		//if(past3daysSum == 0) { past3daysSum = null; }
		//if(past4daysSum == 0) { past4daysSum = null; }
		//if(past5daysSum == 0) { past5daysSum = null; }
		//if(past6daysSum == 0) { past6daysSum = null; }
		//if(past7daysSum == 0) { past7daysSum = null; }
		//lastTick 500kcal buffer
		if(past0daysSum > lastTick-500)									{ lastTick = past0daysSum*1.5; }
		if(past1daysSum > lastTick-500 && past1daysSum > past0daysSum)	{ lastTick = past1daysSum*1.5; }
		if(past2daysSum > lastTick-500 && past2daysSum > past1daysSum)	{ lastTick = past2daysSum*1.5; }
		if(past3daysSum > lastTick-500 && past3daysSum > past2daysSum)	{ lastTick = past3daysSum*1.5; }
		if(past4daysSum > lastTick-500 && past4daysSum > past3daysSum)	{ lastTick = past4daysSum*1.5; }
		if(past5daysSum > lastTick-500 && past5daysSum > past4daysSum)	{ lastTick = past5daysSum*1.5; }
		if(past6daysSum > lastTick-500 && past6daysSum > past5daysSum)	{ lastTick = past6daysSum*1.5; }
		if(past7daysSum > lastTick-500 && past7daysSum > past6daysSum)	{ lastTick = past7daysSum*1.5; }
		//min lastTick val
		//if(lastTick < 300) { lastTick = 300; }
		if(lastTick < 600) { lastTick = lastTick+600; }
		//firstTick -500kcal buffer
		if(past0daysSum < 0)								{ firstTick = past0daysSum*2; }
		if(past1daysSum < 0 && past1daysSum < past0daysSum)	{ firstTick = past1daysSum*2; }
		if(past2daysSum < 0 && past2daysSum < past1daysSum)	{ firstTick = past2daysSum*2; }
		if(past3daysSum < 0 && past3daysSum < past2daysSum)	{ firstTick = past3daysSum*2; }
		if(past4daysSum < 0 && past4daysSum < past3daysSum)	{ firstTick = past4daysSum*2; }
		if(past5daysSum < 0 && past5daysSum < past4daysSum)	{ firstTick = past5daysSum*2; }
		if(past6daysSum < 0 && past6daysSum < past5daysSum)	{ firstTick = past6daysSum*2; }
		if(past7daysSum < 0 && past7daysSum < past6daysSum)	{ firstTick = past7daysSum*2; }
		//min neg pad start at -500
		if(firstTick < 0 && firstTick > -500) { firstTick = -500; }
		//no null yesterday label
		var past1daysColor = 'rgba(0,0,0,1)';
		var past2daysColor = 'rgba(0,0,0,1)';
		var past3daysColor = 'rgba(0,0,0,1)';
		var past4daysColor = 'rgba(0,0,0,1)';
		//
		if(past1daysSum == 0) { past1daysColor = 'rgba(0,0,0,0)'; }
		if(past2daysSum == 0) { past2daysColor = 'rgba(0,0,0,0)'; }
		if(past3daysSum == 0) { past3daysColor = 'rgba(0,0,0,0)'; }
		if(past4daysSum == 0) { past4daysColor = 'rgba(0,0,0,0)'; }
		////////////////////
		// GENERATE CHART //
		////////////////////
		$('#appStatusIntake div').css('padding-top', '0px');
		var catFontSize = lang == 'fa' ? '8px' : '9px';
		var spacingBottom = Highcharts.product.contains('4.0') ? 0 : -12
		if(app.device.android2) { spacingBottom = -16; }
		//check exists
		if(!app.read('app_last_tab','tab1'))	{ return; }
		if(!$('#appStatusIntake').html())		{ return; } 
		$('#appStatusIntake').highcharts({
			chart : {
				reflow: false,
				spacingLeft   : $('#appStatusIntake').width() / -6,
				spacingRight  : $('#appStatusIntake').width() / -7.2,
				spacingTop    : -1,
				spacingBottom : spacingBottom,
				height : (hasTap() || app.device.osx) ? 64 : 66,
				width : $('#appStatusIntake').width()
			},
			credits : {
				enabled : false
			},
			legend : {
				enabled : false
			},
			title : {
				text : ''
			},
			subtitle : {
				text : ''
			},
			xAxis : {
				categories : ['', past4daysLabel, past3daysLabel, past2daysLabel, past1daysLabel, ''],
				labels : {
					style : {
						color : 'rgba(47, 126, 216, .45)',
						fontSize : catFontSize
					},
					y : -2,
					x : 0
				}
			},
			yAxis : {
				title : {
					text : ''
				},
				tickPositions : [firstTick, origTick, lastTick],
				gridLineColor : 'rgba(0,0,0,.16)',
				gridLineDashStyle : 'longdash',
				labels : {
					enabled : false,
					align : 'left',
					x : 31,
					y : -1,
					textSize : '8px'
				},
				showFirstLabel : false,
				showLastLabel : false
			},
			tooltip : {
				enabled : false,
				formatter : function () {
					return '<b>' + this.series.name + '</b><br/>' + this.x + ': ' + this.y + '°C';
				}
			},
			plotOptions : {
            series: {
				allowPointSelect: false,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                }
            },
				line : {
					dataLabels : {
						enabled : true,
						style : {
							textShadow : '0 0 3px white',
							fontSize : '8px'
						}
					},
					enableMouseTracking : false
				}
			},
			series : [{
					type : 'area',
					name : 'solid filler',
					animation : false,
					data : [
						past5daysSum,
						past4daysSum,
						past3daysSum,
						past2daysSum,
						past1daysSum,
						past0daysSum
					],
					lineWidth : 1,
					lineColor : 'rgba(47, 126, 216, .5)',
					fillColor : 'rgba(47, 126, 216, .1)',
					marker : {
						enabled : false,
						lineWidth : 0,
						lineColor : 'rgba(0, 0, 0, 0)',
						fillColor : 'rgba(0, 0, 0, 0)',
						states: {
							hover: {
								lineWidth : 1
							}
						}
					}
				},
				{
					type : 'line',
					name : 'line with labels',
					animation : false,
					data : [
						{ y : past5daysSum, dataLabels : { x : 0, color : 'rgba(0,0,0,0)' } },
						{ y : past4daysSum, dataLabels : { x : 0, color : past4daysColor  } },
						{ y : past3daysSum, dataLabels : { x : 0, color : past3daysColor  } },
						{ y : past2daysSum, dataLabels : { x : 0, color : past2daysColor  } },
						{ y : past1daysSum, dataLabels : { x : 0, color : past1daysColor  } },
						{ y : past0daysSum, dataLabels : { x : 0, color : 'rgba(0,0,0,0)' } }
					],
					lineWidth : 0,
					lineColor : 'rgba(0,0,0,.2)',
					fillColor : 'rgba(0,0,0,.05)',
					marker : {
						enabled : false
					},
					line : {
						dataLabels : {
							enabled : true,
							style : {
								textShadow : '0 0 3px white',
								fontSize : '8px'
							}
						}
					}
				}
			]
		});
		//write cache
		app.save('appStatusIntake',$('#appStatusIntake').html());
		$('#appStatusIntake div').css('padding-top', '0px');
		if($('body').hasClass('reCloser')) { 
			$('body').removeClass('reCloser');
			$('body').addClass('closer');
		}
	});
	//wp8 nonstandand
	$('#appStatusIntake').on(touchend,function(){
		return false;
	});
}
//##///////////////////##//
//## GET NUTRI SLIDERS ##//
//##///////////////////##//
function getNutriSliders() {
	///////////////////
	// AUTOFIX RATIO //
	///////////////////
	if(isNaN(parseInt(app.read('appNutrients').split('|')[0])) || isNaN(parseInt(app.read('appNutrients').split('|')[1])) || isNaN(parseInt(app.read('appNutrients').split('|')[2]))  ) {
		app.save('appNutrients','25|50|25');
	}
	///////////////////
	// SAVE CALLBACK //
	///////////////////
	var save = function() {
		if(parseInt(document.getElementById('sliderProInput').value) + parseInt(document.getElementById('sliderCarInput').value) + parseInt(document.getElementById('sliderFatInput').value) == 100) {
			app.save('appNutrients',parseInt(document.getElementById('sliderProInput').value) + '|' + parseInt(document.getElementById('sliderCarInput').value) + '|' + parseInt(document.getElementById('sliderFatInput').value));
			updateNutriRatio();
			return true;
		} else {
			if(hasTouch()) {
				navigator.notification.alert(LANG.PLEASE_REVIEW[lang], voidThis,LANG.TOTAL_ERROR[lang],LANG.OK[lang]);
			} else {
				if(alert(LANG.TOTAL_ERROR[lang] + '\n' + LANG.PLEASE_REVIEW[lang]));
			}
			return false;
		}
	};
	///////////////////////
	// HANDLERS CALLBACK //
	///////////////////////
	var handlers = function() {
		///////////////////
		// PREVENT FOCUS //
		///////////////////
		$('#newWindow input').on(touchstart,function() {
			return false; 
		});
		///////////
		// CARPE //
		///////////
		if(document.getElementById('sliderProRange')) {
			$(document).trigger('carpeSlider');
			document.getElementById('sliderProRange').slider.setValue(0);
			document.getElementById('sliderCarRange').slider.setValue(0);
			document.getElementById('sliderFatRange').slider.setValue(0);
			document.getElementById('sliderProRange').slider.setValue(parseInt(app.read('appNutrients').split('|')[0]));
			document.getElementById('sliderCarRange').slider.setValue(parseInt(app.read('appNutrients').split('|')[1]));
			document.getElementById('sliderFatRange').slider.setValue(parseInt(app.read('appNutrients').split('|')[2]));
		}
		////////////////
		// PRO.UPDATE //
		////////////////
		if(document.getElementById('sliderProInput')) {
		document.getElementById('sliderProInput').update = function() {
			if(document.getElementById('sliderProInput')) {
				document.getElementById('sliderProInput').value = parseInt(document.getElementById('sliderProRange').value)+ '%';
				if(parseInt(document.getElementById('sliderProRange').value) + parseInt(document.getElementById('sliderCarRange').value) + parseInt(document.getElementById('sliderFatRange').value) > 100) { 
					document.getElementById('sliderProInput').value = (100 - (parseInt(document.getElementById('sliderCarRange').value)) - (parseInt(document.getElementById('sliderFatRange').value))) + '%'; 
					document.getElementById('sliderProRange').slider.setValue(100 - (parseInt(document.getElementById('sliderCarRange').value)) - parseInt((document.getElementById('sliderFatRange').value)));
				}
				//update total
				document.getElementById('sliderTotalInput').value = LANG.TOTAL[lang] + ': ' + (parseInt(document.getElementById('sliderFatRange').value) + parseInt(document.getElementById('sliderProRange').value) + parseInt(document.getElementById('sliderCarRange').value)) + '%';
			}
		};
		}
		////////////////
		// CAR.UPDATE //
		////////////////
		if(document.getElementById('sliderCarInput')) {
		document.getElementById('sliderCarInput').update = function() {
			if(document.getElementById('sliderCarInput')) {
				document.getElementById('sliderCarInput').value = parseInt(document.getElementById('sliderCarRange').value)+ '%';
				if(parseInt(document.getElementById('sliderCarRange').value) + parseInt(document.getElementById('sliderProRange').value) + parseInt(document.getElementById('sliderFatRange').value) > 100) { 
					document.getElementById('sliderCarInput').value = (100 - (parseInt(document.getElementById('sliderProRange').value)) - (parseInt(document.getElementById('sliderFatRange').value))) + '%'; 
					document.getElementById('sliderCarRange').slider.setValue(100 - (parseInt(document.getElementById('sliderProRange').value)) - parseInt((document.getElementById('sliderFatRange').value)));
				}
				//update total	
				document.getElementById('sliderTotalInput').value = LANG.TOTAL[lang] + ': ' + (parseInt(document.getElementById('sliderFatRange').value) + parseInt(document.getElementById('sliderProRange').value) + parseInt(document.getElementById('sliderCarRange').value)) + '%';
			}
		}}
		////////////////
		// FAT.UPDATE //
		////////////////
		if(document.getElementById('sliderFatInput')) {
		document.getElementById('sliderFatInput').update = function() {
			if(document.getElementById('sliderFatInput')) {
				document.getElementById('sliderFatInput').value = parseInt(document.getElementById('sliderFatRange').value) + '%';
				if(parseInt(document.getElementById('sliderFatRange').value) + parseInt(document.getElementById('sliderProRange').value) + parseInt(document.getElementById('sliderCarRange').value) > 100) { 
					document.getElementById('sliderFatInput').value = (100 - (parseInt(document.getElementById('sliderProRange').value)) - (parseInt(document.getElementById('sliderCarRange').value))) + '%'; 
					document.getElementById('sliderFatRange').slider.setValue(100 - (parseInt(document.getElementById('sliderProRange').value)) - parseInt((document.getElementById('sliderCarRange').value)));
				}
				//update total	
				document.getElementById('sliderTotalInput').value = LANG.TOTAL[lang] + ': ' + (parseInt(document.getElementById('sliderFatRange').value) + parseInt(document.getElementById('sliderProRange').value) + parseInt(document.getElementById('sliderCarRange').value)) + '%';
			}
		}}	
		/////////////////
		// INIT VALUES //
		/////////////////
		if(document.getElementById('sliderProRange')) {
			$('#sliderProInput').trigger('update');
			$('#sliderCarInput').trigger('update');
			$('#sliderFatInput').trigger('update');
		}
		///////////////////////
		// TIME SPAN CONTROL //
		///////////////////////
		$('#sliderTimeSpan div').on(touchstart,function(evt) {
			$('.activeOption').removeClass('activeOption');
			$(this).addClass('activeOption');
				 if($(this).attr('id') == 'divTimeSpan1') { app.save('appNutrientTimeSpan',1);  }
		    else if($(this).attr('id') == 'divTimeSpan2') { app.save('appNutrientTimeSpan',7);  }
			else if($(this).attr('id') == 'divTimeSpan3') { app.save('appNutrientTimeSpan',30); }
			else if($(this).attr('id') == 'divTimeSpan4') { app.save('appNutrientTimeSpan',0);  }
			return false;
		});
		//READ STORED
		     if(app.read('appNutrientTimeSpan',1))  { $('#divTimeSpan1').addClass('activeOption'); }
		else if(app.read('appNutrientTimeSpan',7))  { $('#divTimeSpan2').addClass('activeOption'); }	
		else if(app.read('appNutrientTimeSpan',30)) { $('#divTimeSpan3').addClass('activeOption'); }
		else if(app.read('appNutrientTimeSpan',0))  { $('#divTimeSpan4').addClass('activeOption'); }
		//////////////
		// RATIO BY //
		//////////////
		$('#sliderRatioByG,#sliderRatioByKcal').on(touchstart,function(evt) {
			$('#sliderRatioByG,#sliderRatioByKcal').removeClass('active');
			$('#' + evt.target.id).addClass('active');
			if(evt.target.id == 'sliderRatioByG') {
				app.save('appRatioBy','g');
			} else {
				app.save('appRatioBy','kcal');
			}
			return false;
		});
		//
		if(app.read('appRatioBy','g')) {
			$('#sliderRatioByG').addClass('active');
		} else {
			$('#sliderRatioByKcal').addClass('active');
		}
	}
	////////////////
	// HTML BLOCK //
	////////////////
	var htmlContent = '\
		<input type="text" id="sliderTotalInput" />\
		<div id="sliderRatioBy">\
			<div id="sliderRatioByG">' + LANG.G[lang]       + '</div>\
			<div id="sliderRatioByKcal">' + LANG.KCAL[lang] + '</div>\
		</div>\
		<div id="sliderTimeSpan">\
			<div id="divTimeSpan1">' + LANG.TODAY[lang]    + '</div>\
			<div id="divTimeSpan2">' + LANG.LAST_7[lang]   + '</div>\
			<div id="divTimeSpan3">' + LANG.LAST_30[lang]  + '</div>\
			<div id="divTimeSpan4">' + LANG.ALL_DAYS[lang] + '</div>\
		</div>\
		<div id="sliderPro">\
			<input type="text" id="sliderProInput" />\
			<div id="sliderProLabel">' + LANG.PROTEINS[lang] + '</div>\
			<div id="sliderProWrapper"><input id="sliderProRange" type="range" min="0" max="100" step="1" value="0" data-carpe-targets="sliderProInput" data-carpe-decimals="0" /></div>\
		</div>\
		<div id="sliderCar">\
			<input type="text" id="sliderCarInput" />\
			<div id="sliderCarLabel">' + LANG.CARBS[lang] + '</div>\
			<div id="sliderCarWrapper"><input id="sliderCarRange" type="range" min="0" max="100" step="1" value="0" data-carpe-targets="sliderCarInput" data-carpe-decimals="0" /></div>\
		</div>\
		<div id="sliderFat">\
			<input type="text" id="sliderFatInput" />\
			<div id="sliderFatLabel">' + LANG.FATS[lang] + '</div>\
			<div id="sliderFatWrapper"><input id="sliderFatRange" type="range" min="0" max="100" step="1" value="0" data-carpe-targets="sliderFatInput" data-carpe-decimals="0" /></div>\
		</div>\
	';
	/////////////////////
	// CALL NEW WINDOW //
	/////////////////////
	getNewWindow(LANG.NUTRIENT_TITLE[lang],htmlContent,handlers,save);
}
//##///////////////##//
//## TODAYOVERVIEW ##//
//##///////////////##//
function updateTodayOverview(fullWindow) {
	if (!app.read('app_last_tab', 'tab1')) {
		return;
	}
	//vars
	var today = [];
	today.food = app.read('config_ttf');
	today.exercise = Math.abs(app.read('config_tte'));
	today.intake = app.get.kcals();
	today.absIntake = today.intake + today.exercise;
	today.percent = Math.round((today.food - today.exercise) / ((today.intake) / 100));
	today.left = today.absIntake - today.food;
	//////////
	// calc //
	//////////
	if (today.left < today.exercise && today.exercise > 0 && today.left >= 0) {
		// partially compensaed
		today.Cexercise = today.exercise - today.left;
		today.Lexercise = today.exercise - today.Cexercise;
		today.left = 0;
	} else if (today.left < 0) {
		//fully compensated
		today.Cexercise = today.exercise;
		today.Lexercise = 0;
	} else {
		//still left
		today.Cexercise = 0;
		today.Lexercise = today.exercise;
	}
	//////////
	// HTML //
	//////////
	//update percent
	$('#circlePercentInner').html(today.percent + '%');
	$('#totalConsumed').html(today.food - today.exercise);
	$('#appDayA').html(LANG.DAY[lang] + ' A');
	$('#appDayB').html(LANG.DAY[lang] + ' B');
	$('#appDayC').html(LANG.DAY[lang] + ' C');
	$('#appDayD').html(LANG.DAY[lang] + ' D');
	//update intake
	if (app.read('config_kcals_type', 'cyclic')) {
		//highlight cycle day
		if (app.read('config_kcals_day')) {
			$('.current').removeClass('current');
			$('#' + 'appDay' + app.read('config_kcals_day').toUpperCase()).addClass('current');
		}
		//
		if (app.read('config_kcals_day', 'd')) {
			$('#totalIntake').html('<div id="intakeContent">/ ' + app.read('config_kcals_day_1') + '~<span>' + app.read('config_kcals_day_2') + '</span></div>');
		} else {
			$('#totalIntake').html('<div id="intakeContent">/ <span>' + app.read('config_kcals_day_1') + '</span>~' + app.read('config_kcals_day_2') + '</div>');
		}
	} else {
		$('#totalIntake').html('<div id="intakeContent">/ ' + app.read('config_kcals_day_0') + ' ' + LANG.KCAL[lang] + '</div>');
	}
	///////////////////
	// CHART OPTIONS //
	///////////////////
	var pieOptions = {
		reflow : false,
		colors : ['#1EB618', '#2f7ed8', '#9947F0', '#ee704e', (fullWindow == 1) ? '#ddd' : '#f3f3f3'],
		credits : {
			enabled : false
		},
		chart : {
			reflow : false,
			spacingRight : 0,
			spacingLeft : (fullWindow == 1) ? 0 : -4,
			spacingTop : (fullWindow == 1) ? 5 : -5,
			spacingBottom : (fullWindow == 1) ? 20 : 0,
			height : (fullWindow == 1) ? 380 : 56,
			width : (fullWindow == 1) ? 280 : 60,
			plotBackgroundColor : '#fff',
			plotBorderWidth : 0,
			plotShadow : false
		},
		title : {
			text : ''
		},
		tooltip : {
			pointFormat : ''
		},
		plotOptions : {
			pie : {
				borderColor : '#fff',
				borderWidth : today.percent == 0 ? 0 : 1,
				allowPointSelect : false,
				cursor : 'pointer',
				dataLabels : {
					softConnector : false,
					enabled : (fullWindow == 1) ? true : false,
					format : '{point.y}',
				},
				showInLegend : (fullWindow == 1) ? true : false,
			}
		},
		legend : {
			enabled : (fullWindow == 1) ? true : false,
			itemWidth : 250,
			layout : 'vertical',
			itemStyle : {
				lineHeight : '14px'
			},
			nagivation : {
				animation : 0
			},
			borderRadius : 0,
			borderWidth : 1
		},
		series : [{
				type : 'pie',
				name : '',
				color : '#fff',
				innerSize : (fullWindow == 1) ? '12' : '250%',
				size : (fullWindow == 1) ? '14' : '120%',
				animation : false,
				data : [
					[LANG.FOOD[lang].capitalize() + ' (' + LANG.SURPLUS[lang] + ')', today.left < 0 ? Math.abs(today.left) : 0],
					[LANG.FOOD[lang].capitalize(), today.left > 0 ? today.food : today.food - Math.abs(today.left)],
					[LANG.EXERCISE[lang].capitalize() + ' (' + LANG.COMPENSATED[lang] + ')', today.Cexercise],
					[LANG.EXERCISE[lang].capitalize() + ' (' + LANG.NON_COMPENSATED[lang] + ')', today.Lexercise],
					[LANG.CALORIES_LEFT[lang].capitalize(), today.left < 0 ? 0 : today.left],
				]
			}
		]
	};
	/////////////////////
	// CALL HIGHCHARTS //
	/////////////////////
	if (fullWindow == 1) {
		getNewWindow(LANG.TODAY[lang].capitalize(), '<div id="totalChartWrapper"><div id="totalChart"></div></div>', function () {
			$('#totalChart').highcharts(pieOptions);
		});
	} else {
		$('#appStatusBlock2 #circlePercent').highcharts(pieOptions);
		//SAVE CACHE
		app.save('pieCache',$('#appStatusBlock2').html());
	}
}
//##/////////////##//
//## CYCLIC MENU ##//
//##/////////////##//
function getCyclicMenu() {
	//////////
	// HTML //
	//////////
	var isCyclic = app.read('config_kcals_type','cyclic') ? 'checked' : '';
	var appModeHtml = "\
	<div id='appMode'>\
		<input id='appModeToggle' class='toggle' type='checkbox' " + isCyclic + ">\
		<label for='appModeToggle'></label>\
		<div id='appModeEnable'>\
			<input id='appCyclic1' type='number' value='" + app.read('config_kcals_day_1') + "' />\
			<div id='appCyclic1Title'>" + LANG.DAYS[lang] + " A B C</div>\
			<input id='appCyclic2' type='number' value='" + app.read('config_kcals_day_2') + "' />\
			<div id='appCyclic2Title'>" + LANG.DAY[lang] + " D</div>\
			<div id='appModeEnableInfo'><p>" + LANG.CYCLIC_INFO[lang].split('. ').join('_').split('.').join('.</p><p>').split('_').join('. ') + "</p></div>\
		</div>\
	</div>";
	//////////////
	// HANDLERS //
	//////////////
	var appModeHandlers = function() {
		////////////////
		// VALIDATION //
		////////////////
		app.handlers.validate('#appCyclic1',{minValue: 100, defaultValue: 1600},'','','',function() {
			//BLUR HANDLER
			app.save('config_kcals_day_1',$('#appCyclic1').val());
			if(app.read('config_kcals_type') == 'cyclic' && app.read('config_kcals_day') != 'd') {
				$('#timerDailyInput').val(app.read('config_kcals_day_1'));
			}
			updateTodayOverview();
		});
		app.handlers.validate('#appCyclic2',{minValue: 100, defaultValue: 2000},'','','',function() {
			//BLUR HANDLER
			app.save('config_kcals_day_2',$('#appCyclic2').val());
			if(app.read('config_kcals_type') == 'cyclic' && app.read('config_kcals_day') == 'd') {
				$('#timerDailyInput').val(app.read('config_kcals_day_2'));
			}
			updateTodayOverview();
		});
		//////////////
		// TAP BLUR //
		//////////////
		$('#appMode').on(touchend,function(evt) {
			evt.stopPropagation();
			if($("#appCyclic1").is(':focus') || $("#appCyclic2").is(':focus')) {
				if(evt.target.id != "appCyclic1" && evt.target.id != "appCyclic2") {
					evt.preventDefault();
				}
			}
			if(evt.target.id != "appCyclic1" && evt.target.id != "appCyclic2") {
				$("#appCyclic1").blur();
				$("#appCyclic2").blur();
			}
		});
		/////////////////////
		// SWITCH LISTENER //
		/////////////////////
		//set default
		app.define('config_kcals_type','simple');
		//read stored
		if(app.read('config_kcals_type','cyclic')) {
			$("#appModeToggle").prop('checked',true);
		}
		//TAP
		//app.handlers.activeRow('#appMode label','button',function(evt) {
		$("#appMode label").on(tap,function(evt) {
			if((/checkbox/).test($('#' + evt.target.id).html())) {
				if($('input[type=checkbox]', '#' + evt.target.id).prop('checked') == true) {
					$('input[type=checkbox]', '#' + evt.target.id).prop('checked',false);
				} else {
					$('input[type=checkbox]', '#' + evt.target.id).prop('checked',true);
				}
				$('input[type=checkbox]', '#' + evt.target.id).trigger('change');
			}
		});	
		//ON CHANGE
		$('#appModeToggle').on("change",function(obj) {
			if($('#appModeToggle').prop('checked')) {
				appMode = 'cyclic';
				app.save('config_kcals_type','cyclic');
				$('body').removeClass('simple');
				$('body').addClass('cyclic');
			} else {
				appMode = 'simple';
				app.save('config_kcals_type','simple');
				$('body').removeClass('cyclic');
				$('body').addClass('simple');
			}
			//update underlying
			if(app.read('config_kcals_type','cyclic')) {
				if(app.read('config_kcals_day','d')) {
					$('#timerDailyInput').val(app.read('config_kcals_day_2'));
				} else {
					$('#timerDailyInput').val(app.read('config_kcals_day_1'));
				}
			} else {
				$('#timerDailyInput').val(app.read('config_kcals_day_0'));
			}
		});
	}
	/////////////
	// CONFIRM //
	/////////////
	var appModeConfirm = function() {
		$('#appCyclic1').blur();
		$('#appCyclic2').blur();		
		updateTodayOverview();
		intakeHistory();
		return true;
	}
	/////////////////
	// CALL WINDOW //
	/////////////////
	getNewWindow(LANG.CYCLIC_TITLE[lang],appModeHtml,appModeHandlers,'',appModeConfirm);
}
//##///////////////##//
//## BALANCE METER ##//
//##///////////////##//
function balanceMeter(kcalsInput,update) {
	if(!app.read('app_last_tab','tab1')) { return false; }
	if(isNaN(parseInt(kcalsInput)))		 { return false; }
	if(!kcalsInput)						 { return false; }
	kcalsInput = kcalsInput*-1;
	var balancePos = 0;
	//GET DEFINED
	var llim = app.read('config_limit_1');
	var ulim = app.read('config_limit_2');
	var ml = (Math.abs(llim));
	var pl = (ml*2)/100;
	var pu = (ulim*2)/100;
	// LIMITS 
	if(kcalsInput == 0) {
		balancePos = '50%';
	} else {
		////////////////////
		// SELF REFERENCE //
		////////////////////
		//balancePos = 100 - (((parseFloat(kcalsInput)+600)/12) ) + "%";
		if(parseInt(kcalsInput)*-1 > 0) {
			//positive
			balancePos = 100 - (((parseFloat(kcalsInput)+ulim)/pu) ) + "%";
		} else {
			//negative
			balancePos = 100 - (((parseFloat(kcalsInput)+ml)/pl) ) + "%";
		}
	}
	// LIMITS
	if(parseInt(balancePos) > 100) {
		balancePos = '100%';
	}
	if(parseInt(balancePos) < 0) {
		balancePos = '0';
	}
	//////////////////////
	// UPDATE NO-REPEAT //
	//////////////////////
	var roundedBar = (Math.round(parseFloat($("#balanceBar").css("text-indent")) * 100) / 100);
	var roundedNum = (Math.round(parseFloat(balancePos) * 100) / 100);
	if(roundedBar != roundedNum || update == 'now') {
		$("#balanceBar").css("text-indent",roundedNum + '%');
	}
}
//##/////////////##//
//## LIMIT MENU ##//
//##/////////////##//
function getLimitMenu() {
	//////////
	// HTML //
	//////////
	var appLimitHtml = "\
	<div id='appLimit'>\
		<div id='appLimitEnable'>\
			<input id='appLimit1' type='number' value='" + Math.abs(app.read('config_limit_1')) + "' />\
			<div id='appLimit1Title'>" + LANG.LIMIT_LOWER[lang] + " <span>(" + LANG.DEFICIT[lang] + ")</span></div>\
			<input id='appLimit2' type='number' value='" + app.read('config_limit_2') + "' />\
			<div id='appLimit2Title'>" + LANG.LIMIT_UPPER[lang] + " <span>(" + LANG.SURPLUS[lang] + ")</span></div>\
			<div id='appLimitInfo'><p>" + LANG.LIMIT_INFO[lang].split('. ').join('_').split('.').join('.</p><p>').split('_').join('. ') + "</p></div>\
		</div>\
	</div>";
	//////////////
	// HANDLERS //
	//////////////
	var appLimitHandlers = function() {	
		/////////////////////
		// CORE VALIDATION //
		/////////////////////
		app.handlers.validate('#appLimit1',{minValue: 100, defaultValue: 600},'','','',function() {
			app.save('config_limit_1',$('#appLimit1').val()*-1);
		});
		app.handlers.validate('#appLimit2',{minValue: 100, defaultValue: 600},'','','',function() {
			app.save('config_limit_2',$('#appLimit2').val());
		});
		//////////////
		// TAP BLUR //
		//////////////
		$('#appLimit').on(touchend,function(evt) {
			evt.stopPropagation();
			if($('#appLimit1').is(':focus') || $('#appLimit2').is(':focus')) {
				if(evt.target.id != 'appLimit1' && evt.target.id != 'appLimit2') {
					evt.preventDefault();
				}
			}
			if(evt.target.id != 'appLimit1' && evt.target.id != 'appLimit2') {
				$('#appLimit1').blur();
				$('#appLimit2').blur();
			}
		});
	}
	/////////////
	// CONFIRM //
	/////////////
	var appLimitConfirm = function() {
		$('#appLimit1').blur();
		$('#appLimit2').blur();
		return true;
	}
	/////////////////
	// CALL WINDOW //
	/////////////////
	getNewWindow(LANG.CALORIC_THRESHOLD[lang],appLimitHtml,appLimitHandlers,'',appLimitConfirm);
}
//##/////////////##//
//## GET ELAPSED ##//
//##/////////////##//
function getElapsed(swap) {
	if(!app.read('app_last_tab','tab1')) { return false; }
	////////////////
	// FIRST LOAD //
	////////////////
	app.define('config_swap',1);
	//////////////
	// HOT SWAP //
	//////////////
	if(swap == "next") {
		     if(app.read('config_swap',1)) { app.save('config_swap',2); swap = 2; }
		else if(app.read('config_swap',2)) { app.save('config_swap',3); swap = 3; }
		else if(app.read('config_swap',3)) { app.save('config_swap',1); swap = 1; }
	}
	//////////
	// VARS //
	//////////
	swap = app.read('config_swap');
	var swapData;
	var swapSub;
	//////////////////
	// ELAPSED TIME //
	//////////////////
	if(swap == 1) {
		//DATA
		swapData = dateDiff(app.read('config_start_time'),app.now());
		swapSub  = LANG.ELAPSED_TIME[lang];
	///////////////////
	// RELATIVE TIME //
	///////////////////
	} else if(swap == 2) {
		var nowDate = app.now();
		var eqRatio = (60*60*24*1000) / app.get.kcals();
		var eqDiff  = nowDate - Math.floor(Math.abs(timerKcals*eqRatio));
		//DATA
		swapData = dateDiff(eqDiff,nowDate);
		swapSub  = LANG.RELATIVE_TIME[lang];
	/////////////////
	// WEIGHT LOSS //
	/////////////////
	} else if(swap == 3) {
		var weightLoss;
		var weightLossUnit = app.read('calcForm#pA6H','kilograms') ? LANG.KG[lang] : LANG.LB[lang];
		if(app.read('appStatus','running')) {
			weightLoss = ((((app.read('calcForm#pA6G')) * ((app.now() - (app.read('config_start_time'))) / (60*60*24*7))) / 1000)).toFixed(7);
		} else {
			weightLoss = '0.0000000';
		}
		//DATA
		swapData = weightLoss + ' ' + weightLossUnit;
		swapSub  = LANG.WEIGHT_LOSS[lang];
	}
	////////////////////
	// SHRINK ELIPSIS //
	////////////////////
	if(swap == 1 || swap == 2) {
		//selective shrink
		if(swapData) {
			swapData = swapData.split(LANG.AGO[lang]).join('').split(LANG.PREAGO[lang]).join('');
			if(swapData.length > 20 && $('body').width() <= 360) {
				swapData = swapData.replace(LANG.MINUTES[lang],LANG.MIN[lang]);
				swapData = swapData.replace(LANG.MINUTE[lang],LANG.MIN[lang]);
				swapData = trim(swapData.replace('.',''));
				if((/min/).test(swapData)) {
					swapData = swapData + '.';	
				}
			}
		}
	}
	/////////////////////
 	// UPDATE CONTENTS //
	/////////////////////
	if($('#appStatusElapsed div p').html() != swapData) {
		$('#appStatusElapsed div p').html(swapData);
	}
	if($('#appStatusElapsed div p').html() != swapSub) {
		$('#appStatusElapsed div span').html(swapSub);
		$('#elapsedIndicators div').removeClass('activeSwap');
		$('#ind' + swap).addClass('activeSwap');
	}
}
//##////////////////##//
//## GET ENTRY EDIT ##//
//##////////////////##//
function getEntryEdit(eid) {
	//swap food/exercise button
	getEntry(eid,function(data) {
		//////////////
		// HANDLERS //
		//////////////
		var getEntryHandler = function() {
			// CLEAR HIGHTLIGHT //
			setTimeout(function() {
				$('.longHold').removeClass('longHold');
			},600);
			//food/exercise
			if($("#getEntryTitle").val() >= 0) { 
				$("#divEntryTitle").addClass('food');
			} else {
				$("#getEntryTitle").val( Math.abs($("#getEntryTitle").val()) );
				$("#divEntryTitle").addClass('exercise');
			}
			//MOBISCROLL
			if($.mobiscroll) {
			$('#getEntryDate').mobiscroll().datetime({
				preset: 'datetime',
				minDate: new Date((new Date().getFullYear() - 1),1,1, 0, 0),
				maxDate: new Date(),
				theme: 'ios7',
				lang: 'en',
		       	dateFormat: 'yyyy/mm/dd',
        		dateOrder:  'dd MM yy',
		        timeWheels: 'HH:ii',
		        timeFormat: 'HH:ii',
				setText: LANG.OK[lang].capitalize(),
				closeText: LANG.CANCEL[lang].capitalize(),
				cancelText: LANG.CANCEL[lang].capitalize(),
				dayText: LANG.DAY[lang].capitalize(),
				monthText: LANG.MONTH[lang].capitalize(),
				yearText: LANG.YEAR[lang].capitalize(),
				hourText: LANG.HOURS[lang].capitalize(),
				minuteText: LANG.MINUTES[lang].capitalize(),
				display: 'modal',
				stepMinute: 1,
				animate: 'none',
				monthNames: LANG.MONTH_SHORT[lang].split(', '),
				monthNamesShort: LANG.MONTH_SHORT[lang].split(', '),
				mode: 'scroller',
				showLabel: true,
				useShortLabels: true,
			});
			}
			//HOLD FLICKER
			if(app.device.android) {
				$('body').append('<input type="number" id="dummyInput" style="opacity: 0.001;" />');
				$('#dummyInput').focus();
				$('#dummyInput').blur();
				$('#dummyInput').remove();
			}
			//SET
			$('#getEntryDate').scroller('setDate',new Date(parseInt($('#getEntryDate').val())), true);
			//SAVE IF CHANGED
			$('#getEntryDate').on('change',function() {
				$('#getEntryDateHidden').val(Date.parse($(this).val()));
			});
			$('#getEntryDate').on(touchstart,function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				// HARD PROPAGATION FIX
				if($("#getEntryWrapper input").is(':focus')) {
					kickDown();
					$("#getEntryWrapper input").blur();
					$("#getEntryWrapper input").css('pointer-events','none');
					setTimeout(function() {
						$('#getEntryDate').click();
						$("#getEntryWrapper input").css('pointer-events','auto');
					},900);
				} else {
					$('#getEntryDate').click();
				}
			});
			$('#getEntryDate').on('focus',function() {
				$('#getEntryDate').blur();
			});
			/////////////////////////
			// backport validation //
			/////////////////////////
			app.handlers.validate('#getEntryTitle',{allowDots:false,maxValue:9999,maxLength:4});
			app.handlers.validate('#getEntryPro,#getEntryCar,#getEntryFat',{allowDots:true,maxValue:999,maxLength:7});
			//////////////////////
			// BASIC VALIDATION //
			//////////////////////
			$("#getEntryTitle,#getEntryPro,#getEntryCar,#getEntryFat").on('blur',function(evt) {
				if(evt.target.id == "getEntryTitle") {
					$(this).val(parseInt($(this).val()));
				} else {
					$(this).val(parseFloat($(this).val()));					
				}
				if($(this).val() == "")   { $(this).val(0); }
				if($(this).val() == 0)    { $(this).val(0); }
				if(isNaN($(this).val()))  { $(this).val(0); }
				if(evt.target.id != "getEntryTitle") {
					if($(this).val() < 0) { $(this).val(0); }
				}
				if($(this).val() > 9999)  { $(this).val(9999); }
			});
			$("#getEntryTitle,#getEntryPro,#getEntryCar,#getEntryFat").on('focus', function(evt) {
				if($(this).val() == 0)    { $(this).val(''); }
			});
			//////////////
			// TAP BLUR //
			//////////////
			$('#newWindow').on(touchend,function(evt) {
				evt.stopPropagation();
				if($("#getEntryWrapper input").is(':focus')) {
					if((evt.target.id).indexOf('getEntry') === -1) {
						evt.preventDefault();
					}
				}
				if((evt.target.id).indexOf('getEntry') === -1) {
					kickDown();
					//HARD PROPAGATION FIX
					$("#getEntryWrapper input").blur();
					$("#getEntryWrapper input").css('pointer-events','none');
					setTimeout(function() {
						$("#getEntryWrapper input").css('pointer-events','auto');
					},300);
				}
			});
			////////////////
			// ADD/REMOVE //
			////////////////
			app.handlers.addRemove('#getEntryTitle',0,9999,'int');
			app.handlers.addRemove('#getEntryPro',0,999);
			app.handlers.addRemove('#getEntryCar',0,999);	
			app.handlers.addRemove('#getEntryFat',0,999);
		};
		/////////////
		// CONFIRM //
		/////////////
		var getEntrySave = function() {
			var FoE = $("#divEntryTitle").hasClass('exercise') ? -1 : 1; 
			//WRITE
			updateEntry({
				id:parseInt($('#getEntryId').val()),
				title:($("#getEntryTitle").val() * FoE)            + '',
				body:$("#getEntryBody").val().split("  ").join(" ").split("  ").join(" ").split("  ").join(" ") + '',
				published:parseInt($('#getEntryDateHidden').val()) + '',
				pro:parseFloat($("#getEntryPro").val())            + '',
				car:parseFloat($("#getEntryCar").val())            + '',
				fat:parseFloat($("#getEntryFat").val())            + '',
			},function(removeId,insertDate) {
				//REFRESH DATA
				setTimeout(function() {
					//remove by id
					$('#' + removeId).remove();
					//reinsert by date
					app.exec.updateEntries(insertDate);
					updateEntriesSum();
				}, 0);
			});
			return true;
		};
		//////////
		// HTML //
		//////////
		var pro = data.pro;
		var car = data.car;
		var fat = data.fat;
		if(!data.pro || isNaN(pro)) { pro = 0; }
		if(!data.car || isNaN(car)) { car = 0; }
		if(!data.fat || isNaN(fat)) { fat = 0; }
		var getEntryHtml = '\
			<div id="getEntryWrapper">\
				<div id="divEntryBody"><span>'  + LANG.ADD_NAME[lang] + '</span><input type="text"   id="getEntryBody"  value="' + data.body      + '" /></div>\
				<div id="divEntryTitle"><span>' + LANG.KCAL[lang]     + '</span><input type="number" id="getEntryTitle" value="' + data.title     + '" /></div>\
				<div id="divEntryPro"><span>'   + LANG.PRO[lang]      + '</span><input type="number" id="getEntryPro"   value="' + pro            + '" /></div>\
				<div id="divEntryCar"><span>'   + LANG.CAR[lang]      + '</span><input type="number" id="getEntryCar"   value="' + car            + '" /></div>\
				<div id="divEntryFat"><span>'   + LANG.FAT[lang]      + '</span><input type="number" id="getEntryFat"   value="' + fat            + '" /></div>\
				<div id="divEntryDate"><span>'  + LANG.DATE[lang]     + '</span><input type="text"   id="getEntryDate"  value="' + data.published + '" /></div>\
				<input type="hidden" id="getEntryId"         value="' + data.id        + '" />\
				<input type="hidden" id="getEntryDateHidden" value="' + data.published + '" />\
			</div>';
		/////////////////
		// CALL WINDOW //
		/////////////////
		getNewWindow(LANG.EDIT[lang],getEntryHtml,getEntryHandler,getEntrySave);
	});
}
//##///////////////##//
//## ADVANCED MENU ##//
//##///////////////##//
function buildAdvancedMenu() {
	$("#advancedMenuWrapper").remove();
	$("body").append("\
	<div id='advancedMenuWrapper'>\
		<div id='advancedMenuHeader'>\
			<div id='advBackButton'></div>\
			<div id='advancedMenuTitle'>" + LANG.SETTINGS_ADVANCED[lang] + "</div>\
		</div>\
		<div id='advancedMenu'></div>\
	</div>");
	$("#advancedMenuWrapper").hide();
	//WRAPPER HEIGHT
	$("#advancedMenuWrapper").css("top",($("#appHeader").height()) + "px");
	$("#advancedMenuWrapper").css("bottom",($("#appFooter").height()) + "px");
	$("#advancedMenuWrapper").height($("#appContent").height());
	///////////////
	// CORE HTML //
	///////////////
	$("#advancedMenu").html("\
	<ul>\
		<li id='advancedAutoUpdate'>" + LANG.AUTO_UPDATE[lang] + "</li>\
		<li id='advancedChangelog'>" + LANG.CHANGELOG[lang] + "</li>\
		<li id='advancedReview'>" + LANG.REVIEW[lang] + "</li>\
		<li id='advancedContact'>" + LANG.CONTACT[lang] + "</li>\
		<li id='advancedAbout'>"   + LANG.ABOUT[lang] + "</li>\
	</ul>\
	<ul>\
		<li id='advancedReload'>" + LANG.REBUILD_FOOD_DB[lang] + "</li>\
	</ul>\
	<ul>\
		<li id='advancedReset'>" + LANG.SETTINGS_WIPE[lang] + "</li>\
	</ul>\
	");
	//CONTENT HEIGHT
	$("#advancedMenu").css("top",($("#advancedMenuHeader").height()+1) + "px");	
	$("#advancedMenuWrapper").height($("#appContent").height());	
	//SHOW
	app.handlers.fade(1,'#advancedMenuWrapper',function() {
	//$("#advancedMenuWrapper").fadeIn(200,function() {
		getNiceScroll("#advancedMenu");
		//////////////////
		// LIST HANDLER //
		//////////////////
		//LIST CLOSER HANDLER
		
		app.handlers.activeRow('#advBackButton','button',function() {
		//$("#advBackButton").on(touchend,function() {
			app.handlers.fade(0,'#advancedMenuWrapper');
			//$("#advancedMenuWrapper").fadeOut(200,function() {
			//	$('#advancedMenuWrapper').remove();
			//});
		});
	//ADD ACTIVE
	$("#advancedMenu li").on(touchstart,function(evt) {
		if(!(/checkbox/).test($(this).html())) {
			$(this).addClass("activeRow");
		}
	});
	//REMOVE ACTIVE
	$("#advancedMenu, #advancedMenu li").on(touchend + " " + touchmove + " mouseout scroll",function(evt) {
		$(".activeRow").removeClass("activeRow");
	});
	//#////////////#//
	//# CHANGE LOG #//
	//#////////////#//
	app.handlers.activeRow('#advancedChangelog','button',function(evt) {
	//$("#advancedChangelog").on(tap, function(evt) {
		$.get(hostLocal + "version.txt",function(logFile) {
			var logContent = '';
			//////////
			// HTML //
			//////////
			$.each((logFile.split('\n')),function(l,logLine) {
				if(logLine.indexOf('##') !== -1 || logLine.length < 4) {
					//logContent.push('<p>' + logLine + '</p>');
				} else if(logLine.indexOf('#') !== -1) {
					logLine = (trim(logLine.replace('#',''))).split(' ');
					logContent += '<p>Version ' + logLine[0] + '<span>' + logLine[1].replace('[','').replace(']','') + '</span></p>';
				} else {
					logContent += logLine + '<br />';
				}
			});
			logContent = "<div id='logContent'>" + logContent + "</div>";
			//////////////
			// HANDLERS //
			//////////////
			var logHandler = function () {
				setTimeout(function () {
					$("#newWindowWrapper").on(transitionend, function () {
						$("#advancedMenuWrapper").hide();
					});
				}, 1);
			}
			////////////
			// CLOSER //
			////////////
			var logCloser = function() {
				$("#advancedMenuWrapper").show();
			}
			/////////////////
			// CALL WINDOW //
			/////////////////
			getNewWindow(LANG.CHANGELOG[lang],logContent,logHandler,'',logCloser);
		});
	});
	//#///////#//
	//# ABOUT #//
	//#///////#//
	app.handlers.activeRow('#advancedAbout','button',function(evt) {
		app.about();
	});
	//#//////#//
	//# ZOOM #//
	//#//////#//
	/*
	//<li id='advancedZoom'><span id='zoomx1'></span><span id='zoomx2'></span><span id='zoomx3'></span>zoom</li>\

	app.handlers.activeRow('#zoomx1','button',function(evt) {
		app.zoom(1);
	});
	app.handlers.activeRow('#zoomx2','button',function(evt) {
		app.zoom(2);
	});
	app.handlers.activeRow('#zoomx3','button',function(evt) {
		app.zoom(3);
	});
		*/
	//#/////////#//
	//# CONTACT #//
	//#/////////#//
	app.handlers.activeRow('#advancedContact','button',function(evt) {
		app.url('mailto:support@kcals.net?Subject=KCals%20-%20Support%20(' + app.get.platform(1) + ')');
	});
	//#////////////////#//
	//# RELOAD FOOD DB #//
	//#////////////////#//
	app.handlers.activeRow('#advancedReload','button',function() {
	//$('#advancedReload').on(tap,function(evt) {
		//evt.preventDefault();
		function onConfirmReloadDB(button) {
			if(button === 2) {
				app.remove('foodDbLoaded');
				app.remove('startLock');
				updateFoodDb();
				return false;
			}
		}
		//SHOW DIALOG
		appConfirm(LANG.REBUILD_FOOD_DB[lang], LANG.ARE_YOU_SURE[lang], onConfirmReloadDB, LANG.OK[lang], LANG.CANCEL[lang]);
	});
	///////////////////////////////
	// ALTERNATIVE DEBUG ENABLER //
	///////////////////////////////
	$('#advancedReload').on('longhold', function(evt) {
		//evt.preventDefault();
		if(app.read('config_debug','active')) {
			app.remove('config_debug');
			afterHide();
		} else {
			app.save('config_debug','active');
			afterHide();
		}
	});
	//#////////////////#//
	//# RESET SETTINGS #//
	//#////////////////#//
	app.handlers.activeRow('#advancedReset','button',function(evt) {
	//$('#advancedReset').on(tap,function(evt) {
		//evt.preventDefault();
		//SHOW DIALOG
		appConfirm(LANG.SETTINGS_WIPE_TITLE[lang], LANG.ARE_YOU_SURE[lang], function(button) {
			if(button === 2) {
				$('#advancedReset').off();
				deSetup();
				return false;
			}
		}, LANG.OK[lang], LANG.CANCEL[lang]);
	});
	//#//////////////////////////#//
	//# GENERIC CHECKBOX HANDLER #//
	//#//////////////////////////#//
	//app.handlers.activeRow('#advancedMenu li','button',function(evt) {
	$('#advancedMenu li').on(tap,function(evt) {
		if((/checkbox/).test($('#' + evt.target.id).html())) {
			if($('input[type=checkbox]', '#' + evt.target.id).prop('checked') == true) {
				$('input[type=checkbox]', '#' + evt.target.id).prop('checked',false);
			} else {
				$('input[type=checkbox]', '#' + evt.target.id).prop('checked',true);
			}
			$('input[type=checkbox]', '#' + evt.target.id).trigger('change');
		}
	});	
	});
	//#////////#//
	//# REVIEW #//
	//#////////#//
	if(app.device.ios || app.device.android || app.device.wp8 || app.device.windows8 || app.device.firefoxos || app.device.osxapp || app.device.chromeos) {
		app.handlers.activeRow('#advancedReview','button',function(evt) {
		//$("#advancedReview").on(tap,function(evt) {
			app.url();
		});	
	} else {
		$('#advancedReview').remove();
	}
	//#/////////////////////#//
	//# TOGGLE: AUTO UPDATE #//
	//#/////////////////////#//
	//read stored
	var isAUChecked = app.read('config_autoupdate','on') ? 'checked' : '';
	//append
	app.safeExec(function() {
		$("#advancedAutoUpdate").append("\
			<div>\
				<span id='appAutoUpdateButton'></span>\
				<input id='appAutoUpdateToggle' class='toggle' type='checkbox' " + isAUChecked + ">\
				<label for='appAutoUpdateToggle'></label>\
			</div>\
		");
	});
	/////////////////////////////
	// MANUAL RESTART SHORTCUT //
	/////////////////////////////
	app.handlers.activeRow('#appAutoUpdateButton','button',function(evt) {
	//$("#appAutoUpdateButton").on(tap,function(evt) {
		//evt.stopPropagation();
		function quickReboot(button) {
			if(button === 2) {
				afterHide();
			}
		}
		appConfirm(LANG.APP_UPDATED[lang], LANG.RESTART_NOW[lang], quickReboot, LANG.OK[lang], LANG.CANCEL[lang]);
		return false;
	});
	//////////////////
	// read changes //
	//////////////////
	var buildRemoteTimer;
	$('#appAutoUpdateToggle').on('change',function(evt) {
		if($(this).prop('checked') == true) {
			app.save('config_autoupdate','on');
			clearTimeout(buildRemoteTimer);
			buildRemoteTimer = setTimeout(function() {
				buildRemoteSuperBlock('cached');
			},2000);
		} else {
			$('body').removeClass('loading');
			$('body').removeClass('uptodate');
			$('body').removeClass('pending');
			app.save('config_autoupdate','off');
		}
	});
}
//##//////////////////##//
//## GET CATEGORY~IES ##//
//##//////////////////##//
function getCategory(catId, callback) {
	var orType = '';
	if (catId == '9999') {
		orType = 'food';
	}
	if (catId == '0000') {
		orType = 'exercise';
	}
	var rowsArray = [];
	var i = rowsFood.length;
	////////////
	// RECENT //
	////////////
	if (catId == '0001') {
		var recentArray = app.read('app_recent_items', '', 'object');
		while (i--) {
			if (recentArray.length > 0 && rowsFood[i]) {
				if (recentArray.contains('#' + rowsFood[i].id + '#')) {
					var recentRow = rowsFood[i];
					for (var r = 0, len = recentArray.length; r < len; r++) {
						if ('#' + recentRow.id + '#' == recentArray[r].id) {
							recentRow.time = recentArray[r].time;
							rowsArray.push(recentRow);
							break;
						}
					}
				}
			}
		}
		callback(rowsArray.sortbyattr('time', 'asc'));
		//////////////////
		// REGULAR DUMP //
		//////////////////
	} else {
		while (i--) {
			if (rowsFood[i]) {
				if (rowsFood[i].type === catId || rowsFood[i].type === orType) {
					rowsArray.push(rowsFood[i]);
				}
			}
		}
		callback(rowsArray.sortbyattr('term', 'desc'));
	}
}
function getCatList(callback) {
	//STARTLOCK
	var startLock = 1;
	//BUILD CONTENT ARRAY
	var helpTopics = sortObject(LANG.FOOD_CATEGORIES[lang]);
	var helpHtml = "";
	//CATLIST
	var h = helpTopics.length;
	while(h--) {
		helpHtml = helpHtml + "<li id='cat" + helpTopics[h][0] + "'><div>" + helpTopics[h][1] + "</div></li>";
	};
	//RECENT ROW
	helpHtml = '<li id="cat0001"><div>' + LANG.RECENT_ENTRIES[lang] + '</div></li>' + helpHtml;
	///////////////////////
	// INSERT TOPIC LIST //
	///////////////////////
	$('#tabMyCatsBlock').html('<ul>' + helpHtml + '</ul>');
	niceResizer(300);
	/////////////
	// HANDLER //
	/////////////
	app.handlers.activeRow('#foodList li','activeRow',function(targetId) {
		var catCode = targetId.replace('cat', '');
		//SQL QUERY
		getCategory(catCode, function(data) {
			///////////
			// TITLE //
			///////////
			var catListTitle = catCode == 0001 ? LANG.RECENT_ENTRIES[lang] : LANG.FOOD_CATEGORIES[lang][catCode];
			//add 'clear all' 
			//////////
			// HTML //
			//////////
			catListHtml = app.handlers.buildRows(data);
			/////////////
			// HANDLER //
			/////////////
			var catListHandler = function () {
				$('#tabMyCatsBlock').addClass('out');
				//$("#newWindow").addClass('firstLoad');
				//////////////////////
				// ENDSCROLL LOADER //
				//////////////////////
				if(catCode == 0001) { 
					$('#newWindow').removeClass('firstLoad');
					$('#saveButton').addClass('removeAll');
				}
				var catLock = 0;
				var catTimer;
				$('#newWindow').scroll(function() {
					clearTimeout(catTimer);
					catTimer = setTimeout(function() {
						if(catLock != 0)                           { return; }
						if(!$('#newWindow').hasClass('firstLoad')) { return; }
						if($('#newWindow').scrollTop() > 3000 || ($('#newWindow').scrollTop() > 300 && app.device.wp8)) {
							spinner('start','loadingMask');
							catLock = 1;
							setTimeout(function() {
								$("#newWindow").removeClass('firstLoad');
								spinner('stop','loadingMask');
								niceResizer();
								kickDown();
								return false;
							},300);
						}
					},300);
				});
				setTimeout(function () {
					$("#newWindowWrapper").on(transitionend, function() {
						setTimeout(function () {
							$("#pageSlideFood").hide();
						}, 100);
					});
				}, 0);
				//////////////////
				// MODAL CALLER //
				//////////////////
				//$("#newWindow div.searcheable").on(tap, function (evt) {
				//	$("#activeOverflow").removeAttr("id");
				//	$(".activeOverflow").removeClass("activeOverflow");
				//	$(this).addClass("activeOverflow");
				//	$(".foodName", this).attr("id", "activeOverflow");
				//	$(".foodName").css("overflow", "auto");
				//});
				app.handlers.activeRow('#newWindow .searcheable','activeOverflow',function(rowId) {
					getModalWindow(rowId);
				});
			}
			////////////
			// CLOSER //
			////////////
			var catListCloser = function () {
				catMoveCount = 0;
				catBlockTap = false;
				$(".activeRow").removeClass("activeRow");
				if(app.device.wp8) {
					$("#tabMyCatsBlock").removeClass('out');
				}
				$("#pageSlideFood").show();
				setTimeout(function () {
					$("#tabMyCatsBlock").removeClass('out');	
					niceResizer();
				}, 0);
			}
			/////////////
			// CONFIRM //
			/////////////
			var catListConfirm = (catCode == 0001) ? function() {
				appConfirm(LANG.CLEAR_ALL_TITLE[lang], LANG.ARE_YOU_SURE[lang],function(button) {
					if(button === 2) {
						$('#newWindow .searcheable').remove();
						$('#newWindow').prepend('<div class="searcheable noContent"><div><em>' + LANG.NO_ENTRIES[lang] + '</em></div></div>');
						app.remove('app_recent_items');
						setPush();
					}
				}, LANG.OK[lang], LANG.CANCEL[lang]);
			} : '';
			/////////////////
			// CALL WINDOW //
			/////////////////
			getNewWindow(catListTitle, catListHtml, catListHandler, catListConfirm, catListCloser,'sideload','flush');
		});
	},function() {
		if(!$('#pageSlideFood').length || ($('#pageSlideFood').hasClass('busy') && !$('#pageSlideFood').hasClass('open'))) {
			return false; 
		}
	});
}
