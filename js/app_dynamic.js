﻿//##//////////////////////////##//
//##     DYNAMIC HANDLERS     ##//
//##$(document).on("pageload")##//
$(document).on('pageload', function (evt) {
	'use strict';
	// PREVENT++ //
	var tgt = (evt.target.id > 0) ? '#' + evt.target.id : '';
	var entryReturn = false;
	//#///////////#//
	//# HOLD EDIT #//
	//#///////////#//
	//var holdStart;
	var deMove = 0;
	var cancelEdit = 0;
	var deKeyboard = 0;
	app.globals.blockEntrylist = false;
	//
	$('#entryList div' + tgt).on(touchstart, function (evt) {
		deMove = 0;
		if ($('#entryTime').is(':focus')) {
			entryReturn = true;
		}
		if ($('#entryBody').is(':focus')) {
			entryReturn = true;
		}
		deKeyboard = 0;
		deMove = 0;
		cancelEdit = 0;
	});
	//////////////
	// TAP EDIT //
	//////////////
	$('#entryList div' + tgt).on(tap, function (event) {
		event.preventDefault();
		///////////////////////
		// planned quick add //
		///////////////////////
		if ($('#' + event.target.id).hasClass('planned')) {
			getEntry($('#' + event.target.id).parent('div').prop('id'), function (data) {
				//data.reuse = true;
				data.info = '';
				var newId = app.now();
				data.published = newId;
				app.timeout('reusePlannedEntry', 200, function () {
					saveEntry(data, function () {
						app.exec.updateEntries(newId);
						updateTimer();
						updateEntriesSum();
						updateEntriesTime();
						//SCROLLBAR UPDATE
						niceResizer(150);
					});
				});
			});
			return;
		} //end planned
		//////////////
		// TAP DATE //
		//////////////
		if (event.target.id.length == 14 && !$('#kcalsDiv').is(':visible') && !$('#timerDailyInput').is(':focus')) {
			if(!$('.editableInput').is(':visible')) {
				$('#' + event.target.id).html2(dtFormat(Number(event.target.id.replace('t', ''))));
				setTimeout(function () {
					$('#' + event.target.id).html2(dateDiff(event.target.id.replace('t', ''), (new Date()).getTime()));
				},2000);
			}
			entryReturn = true;
		}
		//////////////////
		// TAP DIV EDIT //
		//////////////////
		//no delete
		if (!$('.active').hasClass('open')) {
			$('.active').addClass('busy');
			$('.active').removeClass('open');
			$('.active').on(transitionend, function (evt) {
				$('.active').removeClass('busy');
			});
			$('.active').removeClass('active');
			/////////////////////
			// EDIT CONDITIONS //
			/////////////////////w
			if ($('.delete').hasClass('busy') || $('#kcalsDiv').is(':visible') || $('.editableInput').is(':visible') || $('#entryBody').is(':animated') || entryReturn == true || deKeyboard != 0 || blockModal == true || app.globals.blockEntrylist == true) {
				entryReturn = false;
				return;
			}
			////////////////////////
			// START ENTRY UPDATE //
			////////////////////////
			if (!$('.editableInput').is(':visible')) {
				if (!$(this).has('input').length) {
					var value = trim($('.entriesBody', this).text());
					//var kcals = $('.entriesTitle', this).html();
					var timedBlur = new Date().getTime();
					$('.entriesTitle', this).prop('id', 'kcalsDiv');
					var input = $('<input/>', {
							'type' : 'text',
							'id' : 'editableInput',
							'class' : 'editableInput',
							'value' : value,
							//ONCHANGE HANDLER
							blur : function () {
								////////////////
								// TIMED BLUR //
								////////////////
								app.globals.blockEntrylist = true;
								app.timeout('blockEntrylist',1000,function() {
									app.globals.blockEntrylist = false;
								});
								
								var nowBlur = new Date().getTime();
								//prevent keyboard jump
								if (app.device.android || app.device.firefoxos || app.device.wp8 || app.device.msapp) {
									if (nowBlur - timedBlur < 600) {
										//var blurVal = $('editableInput').val();
										$('#editableInput').focus();
										setTimeout(function () {
											$('#editableInput').focus();
										}, 0);
										return;
									}
								}
								var new_value = $(this).val();
								//VALIDATE
								if (this.value == '') {
									if(document.getElementById('kcalsDiv')) {
										if (Number(document.getElementById('kcalsDiv').innerHTML) > 0) {
											new_value = LANG.FOOD[lang];
										} else if (Number(document.getElementById('kcalsDiv').innerHTML) < 0) {
											new_value = LANG.EXERCISE[lang];
										} else {
											new_value = '';
										}
									}
								}
								$(this).replaceWith(new_value);
								$('#kcalsAdjust').remove();
								$('#kcalsDiv').parent('div').removeClass('editing');
								var highTarget = $('#kcalsDiv').parent('div');
								app.highlight(highTarget,300,'#ffc','#fff',function () {
									//eP = 0;
									deKeyboard = (new Date()).getTime();
									return false;
								});
								$('#kcalsDiv').removeAttr('id');
								$('#sliderBlock').fadeOut(500);
								//whitegap fix
								setTimeout(function () {
									updateEntriesSum();
								}, 0);
								kickDown();
								return false;
							},
							change : function () {
								//save changes
								var editableValue = trimSpace($('#editableInput').val());
								saveEntry({
									body : editableValue,
									id : $(this).closest('div').data('id')
								});
								//set blur
								if (!$('#entryList div').is(':animated')) {
									$('#editableInput').blur();
								}
							}
						});
					//start edit
					$('.entriesBody', this).empty();
					$('.entriesBody', this).html2(input);
					$('.entriesBody', this).after2('<p id="kcalsAdjust">\
						<span id="adjustNegBlock"><span id="adjustNeg"></span></span>\
						<span id="adjustPosBlock"><span id="adjustPos"></span></span>\
						</p>');
					$('#editableInput').focus();
					///////////////////////
					// RESET ENTRY VALUE //
					///////////////////////
					$('#kcalsDiv').off(touchstart).on(touchstart, function (evt) {
						evt.preventDefault();
						timedBlur = new Date().getTime() - 6 * 1000;
						//no reset block
						if (!$(this).parent('div').hasClass('editing')) {
							return;
						}
						var thisRowId = $(this).closest('div').data('id');
						//INTOTHEVOID
						function intoTheVoid(button) {
							//ON CONFIRM
							timedBlur = new Date().getTime();
							if (button === 2) {
								$('#' + thisRowId + ' ' + '.entriesTitle').html2('0');
								$('#' + thisRowId + ' ' + '.entriesTitle').css2('color', '#333');
								//save
								saveEntry({
									title : '0',
									id : thisRowId
								});
								updateTimer();
							}
							return false;
						}
						//SHOW DIALOG
						appConfirm(LANG.RESET_ENTRY_TITLE[lang], LANG.ARE_YOU_SURE[lang], intoTheVoid, LANG.OK[lang], LANG.CANCEL[lang]);
						return false;
					});
					/////////////////////
					// POSITIVE ADJUST //
					/////////////////////
					var adjustPosBlockSave;
					app.handlers.repeater('#adjustPosBlock','activeBlock',400,25,function() {
					//$("#adjustPosBlock").on(touchstart, function (evt) {
						var titleVal = Number($('#kcalsDiv').html());
						var idVal    = $('#kcalsDiv').parent('div').prop('id');
						var bodyVal  = $('#editableInput').val();
						//prevent android click-blur
						timedBlur = app.now();
						if (titleVal <= 9999) {
							//first click 9999
							if (titleVal == -9999) {
								titleVal = -9998;
							} else {
								titleVal = titleVal + 1;
							}
							//limit 9999
							if (titleVal >= 9999) {
								titleVal = 9999;
							}
							if (titleVal >= 0) {
								$('#kcalsDiv').css2('color','#333');
							}
							//update dom
							$('#kcalsDiv').html2(titleVal);
							//save value
							clearTimeout(adjustPosBlockSave);
							adjustPosBlockSave = setTimeout(function () {
								saveEntry({
									title : titleVal,
									body : bodyVal,
									id : idVal
								});
								updateTimer();
							}, 450);
						}
						return false;
					});
					/////////////////////
					// NEGATIVE ADJUST //
					/////////////////////
					var adjustNegBlockSave;
					app.handlers.repeater('#adjustNegBlock','activeBlock',400,25,function() {
					//$("#adjustNegBlock").on(touchstart, function (evt) {
						var titleVal = Number($('#kcalsDiv').html());
						var idVal    = $('#kcalsDiv').parent('div').prop('id');
						var bodyVal  = $('#editableInput').val();
						//prevent android click-blur
						timedBlur = app.now();
						if (titleVal >= -9999) {
							//first click 9999
							if (titleVal == 9999) {
								titleVal = 9998;
							} else {
								titleVal = titleVal - 1;
							}
							//limit 9999
							if (titleVal < -9999) {
								titleVal = -9999;
							}
							if (titleVal < 0) {
								$('#kcalsDiv').css2('color','#C00');
							}
							//update dom
							$('#kcalsDiv').html2(titleVal);
							//save value
							clearTimeout(adjustNegBlockSave);
							adjustNegBlockSave = setTimeout(function () {
								saveEntry({
									title : titleVal,
									body : bodyVal,
									id : idVal
								});
								updateTimer();
							}, 450);
						}
						return false;
					});
					//////////////////////////////////
					// prevent empty list highlight //
					//////////////////////////////////
					if (!isNaN($(this).closest('div').prop('id'))) {
						var editableValue = $('#editableInput').val();
						if (editableValue == LANG.FOOD[lang] || editableValue == LANG.EXERCISE[lang]) {
							$('#editableInput').val('');
						}
						//remove double spaces
						$('#editableInput').val( trimSpace($('#editableInput').val()) );
						// FOCUS, THEN SET VALUE
						//$('#editableInput').select();
						$('#editableInput').focus();
						var closeTarget = $(this).closest('div');
						app.highlight(closeTarget,300,'#fff','#ffc');
						closeTarget.addClass('editing');
						$('#sliderBlock').remove();
						$('#entryListForm').prepend2('<div id="sliderBlock"></div>');
						//blur block
						$('#sliderBlock').on(touchstart, function (evt) {
							evt.preventDefault();
							evt.stopPropagation();
							if (!$('#entryList div').is(':animated')) {
								$('#editableInput').blur();
							}
						});
					}
				}
			}
			//////////////////////
			// END ENTRY UPDATE //
			//////////////////////
		}
	});
	//#/////////////#//
	//# GLOBAL HIDE #//
	//#/////////////#//
	function hideEntry(evt) {
		if(!app.read('app_last_tab','tab2'))	{ return; }
		//PREVENT MULTIPLE
		app.timeout('hideEntry',1,function() {
			if (!$('.active').hasClass('busy')) {
				$('.active').addClass('busy');
				$('.active').removeClass('open');
				$('.active').on(transitionend, function () {
					$('.active').removeClass('busy');
				});
				$('.active').removeClass('active');
			}
		});
	}
	$('#entryListForm, #go, #entryListWrapper').on(tap, function (evt) {
		hideEntry(evt);
	});
	//////////
	// HOLD //
	//////////
	/*
	$('#entryList div' + tgt).on(hold,function(evt) {
		$(this).trigger('swipe');
	});
	*/
	//#///////////////#//
	//# IOS ROW SWIPE #//
	//#///////////////#//
	$('#entryList div' + tgt).on(swipe,function (evt) {
		var swippen = $(this);
		//HIDE
		if ($('.delete').hasClass('open') && !$('.delete').hasClass('busy')) {
			hideEntry(evt);
			return;
		}
		//SHOW
		if (!$('#entryList div').hasClass('appHighlight') && !$('.delete').hasClass('busy') && !$('#editableInput').length && !$('#editableInput').is(':visible') && !$('#timerDailyInput').is(':focus') && !$('#editableInput').is(':focus') && !$('#entryBody').is(':focus') && !$('#entryTime').is(':focus')) {
			$('.delete', swippen).addClass('busy');
			setTimeout(function () {
				$('.delete', swippen).addClass('active');
				$('.delete', swippen).addClass('open');
				$('.delete', swippen).on(transitionend, function (evt) {
					$('.delete').removeClass('busy');
					app.timeout('removeSwipeBusy','clear');
				});
				//ffos
				app.timeout('removeSwipeBusy',200,function() {
					$('.delete').removeClass('busy');
				});
			}, 0);
		}
	});
	/////////////////////
	// STOP ENTRY EDIT //
	/////////////////////
	$('#entryListForm,#go,#sliderBlock,#entryList div,#entryListBottomBar').on(touchstart, function (evt) {
		if (!$('.editableInput').is(':visible')) {
			return;
		}
		if ($('.editableInput').is(':visible') && ($('#editableInput').is(':focus') || app.device.wp8)) {
			//dismiss protection
			//if($("#entryList div" + tgt).is(':animated')) { return; }
			//ALLOW ENTRY INPUT RETINA FOCUS
			//evt.preventDefault();
			evt.stopPropagation();
			//ID MATCH
			if (!$('#entryList div').is(':animated')) {
				if ($(this).prop('id') != $('#editableInput').closest('div').prop('id')) {
					$('#editableInput').blur();
					evt.preventDefault();
					evt.stopPropagation();
				}
			}
		}
	});
	//wrapper click
	$('#entryListWrapper').on(touchstart, function (evt) {
		//allow unfocus on list click
		//$('#timerDailyInput').blur();
		$('#entryTitle').blur();
		$('#entryBody').blur();
		$('#entryTime').blur();
		//
		if (evt.target.id == 'entryListWrapper') {
			if (!$('#entryList div').is(':animated')) {
				$('#editableInput').blur();
				//rekeyboarding on entrywrapper tap dismiss
				if (app.device.ios) {
					//evt.preventDefault();
					//evt.stopPropagation();
					$('#entryListForm').prepend2('<div id="sliderBlock"></div>');
					$('#sliderBlock').fadeOut(700, function (evt) {
						$('#sliderBlock').remove();
					});
				}
				//whitegap mitigation
				if (app.device.android && !$('.active').hasClass('open')) {
					return false;
				}
				//evt.preventDefault();
			}
		}
	});
	//////////////
	// SPAN TAP //
	//////////////
	$(tgt + ' .delete', '#entryList').on(tap, function (evt) {
		var evtId     = evt.target.id;
		//var targetId  = '#' + evt.target.id;
		var targetObj = this;
		///////////
		// REUSE //
		///////////
		if (evtId == 'reuse') {
			getEntry($(targetObj).parent('div').prop('id'), function (data) {
				data.reuse = true;
				app.timeout('reuseEntry',200,function () {					
					saveEntry(data, function (newRowId) {
						app.exec.updateEntries(newRowId);
						updateTimer();
						updateEntriesSum();
						updateEntriesTime();
						//SCROLLBAR UPDATE
						niceResizer(150);
					});
				});
				//HIDE
				hideEntry();
			});
			//
			return;
		}
		//////////
		// EDIT //
		//////////
		if (evtId == 'edit') {
			var editedEntry = $(targetObj).parent('div').prop('id');
			getEntryEdit(editedEntry);
			setTimeout(function () {
				hideEntry();
			}, 300);
			//
			return;
		}
		////////////
		// DELETE //
		////////////
		if (evtId == 'delete') {
			var rowId   = $(targetObj).parent('div').prop('id');
			var rowTime = $(targetObj).parent('div').prop('name');
			//no jump
			$('#appContent').scrollTop($('#appContent').scrollTop());
			$('#' + rowId).hide().remove();
			//IF LAST ROW
			if ($('#entryList .entryListRow').length == 0) {
				$('#entryList').html2('<div id="noEntries"><span>' + LANG.NO_ENTRIES[lang] + '</span></div>');
				updateTimer();
			}
			//UPDATE DB
			deleteEntry({
				id : rowId,
				published : rowTime
			}, function () {
				//REMOVE
				updateTimer();
				updateEntriesTime();
				updateEntriesSum();
				//force error ~ 
				niceResizer();
			});
			//
			return;
		}
	});
//////#//
}); //#//
//////#//
//#//////////////////////#//
//# DYNAMIC HANDLERS 2.0 #//
//#//////////////////////#//
var pageReloads = 0;
$(document).on('pageReload', function (evt) {
	'use strict';
	//pre-load db, then open
	if (!app.read('foodDbLoaded','done')) {
		if(pageReloads > 20) {
			//if(app.dev) { console.log('giving up'); }
			return;
		}
		updateFoodDb();
		app.timeout('pageReload', 200, function() {
			pageReloads++;
			//if(app.dev) { console.log('trying ' + pageReloads); }
			$(document).trigger('pageReload');
		});
		return;
	} else {
		//SUCCESS
		pageReloads = 0;
	}
	//
	evt.preventDefault();
	//PREVENT DOUBLE LOAD
	if($('#pageSlideFood').hasClass('busy') && $('#pageSlideFood').hasClass('open')) {
		return;
	} else {
		$('#pageSlideFood').remove();
	}
	if($('#pageSlideFood').length) {
		if($('#pageSlideFood').is(':animated')) {
			return;
		} else {
			$('#pageSlideFood').remove();
		}
	}
	//evt.stopPropagation();
	//not while editing ~
	if (!$('#entryList div').is(':animated') && !$('.editableInput').is(':visible') && !$('#timerDailyInput').is(':focus') && !$('#appStatusFix').hasClass('open')) {
		//NO SWIPE OVERLAP
		if (!$('.active').hasClass('open')) {
			$('.active').addClass('busy');
			$('.active').removeClass('open');
			$('.active').on(transitionend, function (evt) {
				$('.active').removeClass('busy');
			});
			$('.active').removeClass('active');
			if (!$('.delete').hasClass('busy')) {
				//hide
				if ($('#pageSlideFood').hasClass('open') && !$('#pageSlideFood').hasClass('busy')) {
					$('#pageSlideFood').addClass('busy');
					$('#pageSlideFood').on(transitionend, function (evt) {
						$('#pageSlideFood').removeClass('busy');
						$('#foodSearch').blur();
					});
				} else {
					if (!$('#pageSlideFood').hasClass('busy')) {
						//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						///////////////////////
						// PAGESLIDEFOOD DIV //
						///////////////////////
						$('#pageSlideFood').remove();
						$('body').append2('<div id="pageSlideFood"></div>');
						$('#pageSlideFood').css2('height', ($('body').height() - $('#appHeader').height()) + 'px');
						$('#pageSlideFood').css2('top', $('#appHeader').height() + 'px');
						///////////////
						// CREATE DB //
						///////////////
						clearTimeout(app.globals.pageSlideTimer);
						app.globals.pageSlideTimer = setTimeout(function () {
							$('#pageSlideFood').on(transitionend, function (evt) {
								clearTimeout(app.globals.foodListCloser);
								app.globals.foodListCloser = setTimeout(function() {
									updateFoodDb();
									if($('#pageSlideFood').html() && !$('#pageSlideFood').is(':animated')) {
										$('#appHeader').addClass('closer');
										$('body').addClass('closer');
									}
									setTimeout(function() {
										$('#pageSlideFood').off(transitionend);
									},0);
								},100);
							});
						}, 100);
						///////////////
						// FOOD HTML //
						///////////////
						$('#pageSlideFood').html2('<div id="sideMenuFood"><label id="foodSearchLabel" for="foodSearch"><input tabindex="-2" type="text" id="foodSearch" placeholder="' + LANG.FOOD_SEARCH[lang] + '" /></label><span id="iconClear"></span><span id="iconRefresh" class="icon-refresh"></span><div id="foodListWrapper"><div id="foodList"><span id="noMatches">' + LANG.NO_MATCHES[lang] + '</span></div></div></div>');
						//PRE-ADJUST RESULTS HEIGHT
						$('#foodSearch').width($('body').width() - 55);
						buildFoodMenu();
						//remember search type
						if (app.read('searchType','exercise')) {
							$('#foodSearch').prop('placeholder', LANG.EXERCISE_SEARCH[lang]);
							$('#foodSearch,#pageSlideFood').addClass('exerciseType');
						}
						////////////////////
						// RESULTS HEIGHT //
						////////////////////
						$('#menuTopBar').css2('top', '61px');
						//$('#foodList').css2("margin-top","61px");
						//$('#foodList').css2("min-height", (app.height() - ($('#appHeader').height() + 61)) + "px");
						//$('#foodList').css2("height", (app.height() - ($('#appHeader').height() + 61)) + "px");
						//$('#foodList').css2("top",($('#appHeader').height()) + "px");
						getNiceScroll('#foodList',200,function() {
							niceResizer(200);
						});
						/////////////
						// handler //
						/////////////
						$('#foodList').scroll(function () {
							if (app.device.ios) {
								if ($('#foodList').scrollTop() <= 0) {
									app.hide('#addNewFood,#addNewExercise');
									clearTimeout(app.timers.foodlist);
									app.timers.foodlist = setTimeout(function () {
										app.show('#addNewFood,#addNewExercise');
									}, 1000);
								} else {
									if ($('#addNewFood').css2('opacity') == 0) {
										app.hide('#addNewFood,#addNewExercise');
										clearTimeout(app.timers.foodlist);
										app.timers.foodlist = setTimeout(function () {
											app.show('#addNewFood,#addNewExercise');
										}, 1000);
									} else {
										app.hide('#addNewFood,#addNewExercise');
									}
								}
							} else {
								app.hide('#addNewFood,#addNewExercise');
								clearTimeout(app.timers.foodlist);
								app.timers.foodlist = setTimeout(function () {
									app.show('#addNewFood,#addNewExercise');
								}, 600);
							}
						});
						//#/////////////////////////////////////#//
						//# KEYUP LISTENER SEARCH TIMER-LIMITER #//
						//#/////////////////////////////////////#//
						var inputEvent = app.device.wp8 ? 'keyup' : 'input';
						$('#foodSearch').on(inputEvent,function() {
						//document.getElementById('foodSearch').addEventListener(inputEvent, function () {
							//CLEAR ICON
							if (JSON.stringify($('#foodSearch').val()).length == 0) {
								$('#iconClear').hide();
								$('#iconRefresh').show();
							} else {
								$('#iconRefresh').hide();
								$('#iconClear').show();
							}
							$('#iconClear').on(touchstart, function (evt) {
								//CLEAR TIMEOUT
								app.timeout('searchTimer', 'clear');
								//
								$('#foodSearch').val('');
								$('#iconClear').hide();
								$('#iconRefresh').show();
								//buildFoodMenu();
								$('#searchContents').hide();
								$('#infoContents').show();
								$('#menuTopBar').show();
								return false;
							});
							//SET TIMER
							var ms = 250; //275;
							//faster desktop
							if (!app.device.mobile) {
								ms = 50;
							}
							var val = this.value;
							//DO SEARCH
							app.timeout('searchTimer', ms, function() {
								doSearch($('#foodSearch').val());
								//CLEAR ICON
								if (document.getElementById('foodSearch') && $('#foodSearch').val().length == 0) {
									$('#iconClear').hide();
									$('#iconRefresh').show();
								} else {
									$('#iconRefresh').hide();
									$('#iconClear').show();
								}
							});
						});
						///////////////////
						// HIDE KEYBOARD //
						///////////////////
						$('#foodList').on(tap, function (evt) {
							evt.preventDefault();
							$('#entryBody').blur();
							$('#foodSearch').blur();
						});
						//////////////////////
						// SEARCH TYPE ICON //
						//////////////////////
						$('#iconRefresh').on(touchstart, function (evt) {
							//toggle -if not animated
							$('#iconRefresh').css2('pointer-events','none');
							$('#foodSearch').toggleClass('exerciseType');
							$('#pageSlideFood').toggleClass('exerciseType');
							//enforce iconClear
							$('#searchContents').hide();
							$('#menuTopBar').show();
							$('#infoContents').show();
							//update placeholder n' animate
							if ($('#foodSearch').hasClass('exerciseType')) {
								app.save('searchType','exercise');
								$('#foodSearch').prop('placeholder', LANG.EXERCISE_SEARCH[lang]);
								app.highlight('#foodSearch',500,'#FECEC6','#fff','',500);
							} else {
								app.remove('searchType');
								$('#foodSearch').prop('placeholder', LANG.FOOD_SEARCH[lang]);
								app.highlight('#foodSearch',500,'#BBE4FF','#fff','',500);
							}
							app.timeout('#iconRefresh',500,function() {
								$('#iconRefresh').css2('pointer-events','auto');
							});
						});
						/////////////////////////////////////////
						// FOODSEARCH (QUICKFOCUS) SETOVERFLOW //
						/////////////////////////////////////////
						//$("#foodSearch").on(touchstart, function (evt) {
						//	$(".foodName").css2("overflow", "hidden");
						//	$("#activeOverflow").removeAttr("id");
						//	$(".activeOverflow").removeClass("activeOverflow");
						//});
						//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						//show
						$('#entryBody').blur();
						$('#entryTime').blur();
						//$('#pageSlideFood').css2("opacity",".925");
						$('#pageSlideFood').addClass('busy');
						//open directly on first load
						if (!app.read('foodDbLoaded','done')) {
							$('#pageSlideFood').addClass('open');
						}
						setTimeout(function() {
							if(!$('#pageSlideFood').is(':animated')) {
								$('#pageSlideFood').addClass('open');
								if(!$('#appHeader').hasClass('open')) {
									$('#appHeader').removeClass('closer');
									$('body').removeClass('closer');
								}
							}
						},0);
						//
						$('#loadingDiv').hide();
						$('#appHeader').addClass('open');
						$('#pageSlideFood').on(transitionend, function (evt) {
							$('#pageSlideFood').removeClass('busy');
						});
					}
				}
			}
		}
	}
	//#//
}); //#//
//////#//
//#/////////////////#//
//# CORE SQL SEARCH #//
//#/////////////////#//
function searchFood(searchSQL, callback) {
	'use strict';
	var typeTerm = app.read('searchType','exercise') ? 'exercise' : 'food';
	var dato = appRows.food;
	var keyJunk = 0;
	var keyScore = 0;
	var mi = [];
	//var limited = 0;
	//var results = 0;
	var z = dato.length;
	while(z--) {
		keyScore = 0;
		keyJunk = 0;
		if ((/0000|exercise/i.test(dato[z].type) && typeTerm == 'exercise') || (!/0000|exercise/i.test(dato[z].type) && typeTerm == 'food')) {
			var k = searchSQL.length;
			while(k--) {
				if (dato[z].term.indexOf(searchSQL[k]) != -1 && keyJunk == 0) {
					keyScore = keyScore + dato[z].term.match(searchSQL[k]).index;
				} else {
					keyJunk = 1;
				}
			}
			if (keyJunk == 0) {
				mi.push({
					id : keyScore + (dato[z].term.length/100),
					value : dato[z]
				});
			}
		}
	}
	//SORT
	mi = mi.sortbyattr('id');

	var mou = [];
	for (var u = 0; u <= 50; u++) {
		if (mi[u]) {
			mou.push(mi[u].value);
		}
	}
	callback(mou);
}
//#////////////////////////#//
//# SUB FUNCION: DO SEARCH #//
//#////////////////////////#//
function doSearch(input) {
	'use strict';
	var rawInput = input;
	/////////////////////////
	// APP.TIMEOUT LIMITER //
	/////////////////////////
	app.timeout('doSearchLimiter', 100, function () {
		//////////////////////////
		// ignore null searches //
		//////////////////////////
		if (!rawInput || rawInput == '' || rawInput.length == 0 || typeof rawInput === 'undefined') {
			rawInput = '•••';
		}
		rawInput = (searchalize(rawInput.split(' ').join('xxxyyzyyxxx'))).split('xxxyyzyyxxx').join(' ');
		/////////////////
		// FETCH INPUT //
		/////////////////
		var searchQuery = rawInput;
		var searchSQL = searchQuery.split(' ');
		//#/////////////////////#//
		//# BUILD KEYWORD ARRAY #//
		//#/////////////////////#//
		var keywordArray = [];
		//check for multiple keywords
		if (searchQuery.search(' ') > -1) {
			searchQuery = searchQuery.split(' ');
			//loop each key into array
			for (var i = 0; i < searchQuery.length; i++) {
				//not null
				if (searchQuery[i] != '') {
					//filter duplicates
					if (keywordArray.indexOf(trim(searchQuery[i])) == -1) {
						keywordArray.push(trim(searchQuery[i]));
					}
				}
			}
		} else {
			//single term array
			keywordArray.push(searchQuery);
		}
		//PREVENT EMPTY STRING ON MULTIPLE KEYWORD SEARCH ARRAY
		if (keywordArray != '') {
			var foodList = '';
			//##/////////////////////////////////##//
			//## SEARCHFOOD CORE ~ EXECUTE QUERY ##//
			//##/////////////////////////////////##//
			searchFood(searchSQL, function (data) {
				var sss;
				var lineLoop;
				var lineArray = [];
				var onlineList = '';
				//##///////////////##//
				//## ONLINE SEARCH ##//
				//##///////////////##//
				if (!$('#pageSlideFood').hasClass('exerciseType')) {
					////////////////
					// AJAX QUERY //
					////////////////
					$.ajax({
						type: 'GET',
						dataType: 'text',
						url: app.https + 'dietclock.app/search.php?k=' + searchSQL,
						error: function (xhr, statusText) {
							//offline//
							//errorHandler(statusText);
						},
						success: function (sdb) {
							//TRY
							try {
								if (!sdb) {
									return;
								}
								//////////////
								// EVAL 3:) //
								//////////////
								sss = eval(sdb);
								///////////////
								// LOOP DATA //
								///////////////
								for (var s = 0, slen = sss.length; s < slen; s++) {
									if (sss) {
										if (sss[s]) {
											lineLoop = sss[s];
											lineLoop.term = searchalize(lineLoop.name);
											lineLoop.id = 'o' + lineLoop.id;
											//PREVENT NULL KCAL (SUPPLEMENTS)
											if (lineLoop.kcal != 0 && lineLoop.id) {
												lineArray.pushUnique(lineLoop);
											}
										}
									}
								}
								////////////////
								// BUILD ROWS //
								////////////////
								if (lineArray.length) {
									onlineList = app.handlers.buildRows(lineArray.reverse());
									app.save('online_results', lineArray, 'object');
								}
								///////////////////
								// DOM STRUCTURE //
								///////////////////
								if (!onlineList.contains('noContent')) {
									//CLEAR ICON
									if ($('#foodSearch').val().length != 0) {
										$('#iconRefresh').hide();
										$('#iconClear').show();
										$('.noContent').remove();
										$('#noMatches').remove();
										$('#searchContents .catxxxx').remove();
										$('#searchContents').append2(onlineList);
										niceResizer(200);
										app.handlers.activeRow('#searchContents div.searcheable.catxxxx', 'activeOverflow', function (rowId) {
											getModalWindow(rowId);
										});
									} else {
										$('#iconClear').hide();
										$('#iconRefresh').show();
										$('#searchContents').hide();
									}
								}
							//CATCH
							} catch (err) { errorHandler(err); }
						} //END SUCCESS
					}); //END AJAX
				} // END FOOD ONLY (ONLINE)

				//
				// END ONLINE
				//
				
				//##////////////////##//
				//## REGULAR SEARCH ##//
				//##////////////////##//
				foodList = app.handlers.buildRows(data.reverse());
				// DISPLAY RESULTS
				//matches number
				$('#menuTopBar').hide();
				$('#infoContents').hide();
				//prevent overflow blinking
				$('#searchContents').hide();
				$('#searchContents').html2('');
				//if empty
				if (foodList.contains('noContent')) {
					if ($('#foodSearch').val() != '') {
						$('#noMatches').remove();
						$('#searchContents').html2('<span id="noMatches"> ' + LANG.NO_MATCHES[lang] + ' </span>');
					} else {
						//buildFoodMenu();
						$('#searchContents').hide();
						$('#menuTopBar').show();
						$('#infoContents').show();
					}
				} else {
					$('#searchContents').html2(foodList);
				}
				//chrome height fix
				$('#searchContents').css2('min-height', $('#pageSlideFood').height() + 'px');
				//
				$('#searchContents').show();
				niceResizer(200);
				//enforce clearIcon display
				if (document.getElementById('foodSearch') && $('#foodSearch').val().length != 0) {
					$('#iconRefresh').hide();
					$('#iconClear').show();
				} else {
					$('#iconRefresh').show();
					$('#iconClear').hide();
				}
				//////////////////////
				// GET MODAL WINDOW //
				//////////////////////
				app.handlers.activeRow('#searchContents div.searcheable', 'activeOverflow', function (rowId) {
					getModalWindow(rowId);
				});
			});
		} //END APP.TIMEOUT
	});
}
//#//////////////////////#//
//#  UPDATE CUSTOM LIST  #//
//#//////////////////////#//
function updateCustomList(filter,callback) {
	'use strict';
	if(/cat|all/i.test(filter)) {
		getCatList();
	}
	//FAV
	if(/fav|all|cache/i.test(filter)) {
		$('#tabMyFavsBlock').html2(getCustomList('fav',filter));
		app.handlers.activeRow('#tabMyFavsBlock div.searcheable','activeOverflow',function(rowId) {
			getModalWindow(rowId);
		});
	}
	//ITEM
	if(/items|all|cache/i.test(filter)) {
		$('#tabMyItemsBlock').html2(getCustomList('items',filter));
		$('#addButtons').remove();
		$('#foodList').after2('<div id="addButtons"><div id="addNewFood"><div id="addNewFoodTitle"><span>+</span>' + LANG.NEW_FOOD[lang] + '</div></div><div id="addNewExercise"><div id="addNewExerciseTitle"><span>+</span>' + LANG.NEW_EXERCISE[lang] + '</div></div></div>');
		app.handlers.activeRow('#tabMyItemsBlock div.searcheable','activeOverflow',function(rowId) {
			getModalWindow(rowId);
		});
		//EXTRA HANDLERS
		$('#addNewFood').on(touchstart, function (evt) {
			$('#addNewFood').addClass('active');
			addNewItem({type : 'food',act : 'insert'});
		});
		$('#addNewExercise').on(touchstart, function (evt) {
			$('#addNewExercise').addClass('active');
			addNewItem({type: 'exercise',act: 'insert'});
		});
	}
	if(typeof callback === 'function') {
		callback();
	}
}
//##/////////////////////////////##//
//##    CORE: BUILD FOOD LAYER   ##//
//##/////////////////////////////##//
function buildFoodMenu() {
	'use strict';
	var recentBlock = '\
		<div id="infoContents" class="infoContents">\
		<div id="tabMyCats">\
		<div id="tabMyCatsBlock"></div>\
		</div>\
		<div id="tabMyFavs">\
		<div id="tabMyFavsBlock"></div>\
		</div>\
		<div id="tabMyItems">\
		<div id="tabMyItemsBlock"></div>\
		</div>\
		</div>\
		<div id="searchContents"></div>';
	//////////////
	// TOP MENU //
	//////////////
	$('#foodList').before2('<div id="menuTopBar">\
		<h3 id="topBarItem-1"><span>' + LANG.CATEGORIES[lang] + '</span></h3>\
		<h3 id="topBarItem-2"><span>' + LANG.FAVORITES[lang] + '</span></h3>\
		<h3 id="topBarItem-3"><span>' + LANG.MY_ITEMS[lang] + '</span></h3>\
		</div>');
	$('#foodList').html2(recentBlock);
	//first load db spinner
	if(!app.read('foodDbLoaded','done')) {
		setTimeout(function() {
			updateFoodDb(function() {
				updateCustomList('all');
			});
		},200);
	} else {
		updateCustomList('all');
	}
	/////////////////////
	// FIRST LOAD TABS //
	/////////////////////
	app.define('lastInfoTab','topBarItem-1');
	////////////
	// TAB #1 //
	////////////
	if (app.read('lastInfoTab','topBarItem-1')) {
		$('#tabMyCats, #topBarItem-1').addClass('onFocus');
	}
	////////////
	// TAB #2 //
	////////////
	if (app.read('lastInfoTab','topBarItem-2')) {
		$('#tabMyFavs, #topBarItem-2').addClass('onFocus');
	}
	////////////
	// TAB #3 //
	////////////
	if (app.read('lastInfoTab','topBarItem-3')) {
		$('#tabMyItems, #topBarItem-3').addClass('onFocus');
	}
	////////////////////////
	// SWITCH VISIBLE TAB //
	////////////////////////
	$('#menuTopBar h3').on(touchstart, function (evt) {
		evt.preventDefault();
		$('#foodList').scrollTop(0);
		app.save('lastInfoTab',$(this).prop('id'));
		$('div.activeOverflow').removeClass('activeOverflow');
		////////////
		// TAB #1 //
		////////////
		if (app.read('lastInfoTab','topBarItem-1')) {
			$('#topBarItem-2,#topBarItem-3,#tabMyFavs,#tabMyItems').removeClass('onFocus');
			$('#topBarItem-1,#tabMyCats').addClass('onFocus');
		}
		////////////
		// TAB #2 //
		////////////
		else if (app.read('lastInfoTab','topBarItem-2')) {
			$('#topBarItem-1,#topBarItem-3,#tabMyCats,#tabMyItems').removeClass('onFocus');
			$('#topBarItem-2,#tabMyFavs').addClass('onFocus');
		}
		////////////
		// TAB #3 //
		////////////
		else if (app.read('lastInfoTab','topBarItem-3')) {
			$('#topBarItem-1,#topBarItem-2,#tabMyCats,#tabMyFavs').removeClass('onFocus');
			$('#topBarItem-3,#tabMyItems').addClass('onFocus');
		}
		niceResizer(0);
		return false;
	});
	//TYPE FOOD
	setTimeout(function() {
		setTimeout(function() {
			setTimeout(function() {
				app.info('type_food',LANG.TYPE_FOOD[lang]);
			},100);
		},100);
	},100);
}
//##//////////////////////////##//
//##    CORE: ADD NEW ITEM    ##//
//##//////////////////////////##//
function addNewItem(addnew) {
	'use strict';
	if (!addnew) {
		return;
	}
	if (!addnew.act) {
		addnew.act = 'update';
	}
	///////////////////
	// PREVENT FLOOD //
	///////////////////
	if($('#addNewWrapper').length) {
		$('#modalWrapper').remove();
	}
	/////////////////////
	// FOOD ? EXERCISE //
	/////////////////////
	addnew.isfoodrow   = (/0000|exercise/).test(addnew.type) ? true : false;
	addnew.totalweight = app.get.totalweight();
	///////////////////////
	// ADDNEW.VALIDATE() //
	///////////////////////
	addnew.validate = function() {
		var isValid = 1;
		$('label').removeClass('error');
		if (addnew.name == '' || addnew.name == 0) {
			$('#addNewName label').addClass('error');
			isValid = 0;
		}
		if (addnew.kcal == '' || addnew.kcal == 0 || isNaN(addnew.kcal)) {
			$('#addNewKcal label').addClass('error');
			isValid = 0;
		}
		if ($('#inputNewAmount').val() == '' || $('#inputNewAmount').val() == 0 || isNaN($('#inputNewAmount').val())) {
			$('#addNewAmount label').addClass('error');
			isValid = 0;
		}
		//RETURN VALID
		if(isValid == true) {
			return true;
		} else {
			//ALERT
			alert(LANG.BLANK_FIELD_TITLE[lang], LANG.BLANK_FIELD_DIALOG[lang]);
			return false;
		}
	};
	////////////////////
	// ADDNEW.CLOSE() //
	////////////////////
	addnew.close = function(evt) {
		if(evt) {
			evt = evt.target.id;
		} else {
			evt = '';
		}
		//first tap blur, if focused
		if (evt == 'modalOverlay' && $('#addNewWrapper input').is(':focus')) {
			$('#addNewWrapper input').trigger('blur');
			return false;
		}
		if (app.device.android) {
			kickDown();
		}
		$('#addNewExercise, #addNewFood').removeClass('active');
		$('div.activeOverflow').removeClass('activeOverflow');
		app.handlers.fade(0,'#modalWrapper');
		clearTimeout(app.repeaterLoop);
	};
	///////////////////
	// ADDNEW.SAVE() //
	///////////////////
	addnew.save = function() {
		if($('#saveAsNew').hasClass('active')) {
			addnew.act = 'insert';
		}
		//CREATE ID FOR NEW
		if(addnew.act == 'insert') {
			addnew.id   = new Date().getTime();
			addnew.code = 'c' + addnew.id;
			//allow fav duplication
			if(!$('#saveAsNew').hasClass('active')) {
				addnew.fib  = 'custom';
			}
		}
		//(P)RE-FILL EMPTY NAME
		if($('#inputNewName').val() == '') {
			if(addnew.act == 'insert') {
				if ((/0000|exercise/).test(addnew.type)) {
					addnew.name = LANG.NEW_EXERCISE[lang];
				} else {
					addnew.name = LANG.NEW_FOOD[lang];
				}
			}
		} else {
			addnew.name = $('#inputNewName').val();
		}
		addnew.name = trimSpace(addnew.name).trim();
		//READ INPUT VALUES
		addnew.term = searchalize(addnew.name);
		addnew.kcal = $('#inputNewKcal').val();
		addnew.pro  = $('#inputNewPro').val();
		addnew.car  = $('#inputNewCar').val();
		addnew.fat  = $('#inputNewFat').val();
		addnew.fii  = $('#inputNewFii').val();
		addnew.sug  = $('#inputNewSug').val();
		addnew.sod  = $('#inputNewSod').val();
		//REVERT TO FORMULA
		if ((/0000|exercise/).test(addnew.type)) {
			addnew.kcal = Math.round((((addnew.kcal / addnew.totalweight) / $('#inputNewAmount').val()) * 60) * 100) / 100;
		}
		///////////////////
		// VALIDATE FORM //
		///////////////////
		if(!addnew.validate()) {
			//RETURN FALSE ~ REACTIVATE HANDLER
			$('#addNewConfirm').on(touchstart, function (evt) {
				evt.preventDefault();
				evt.stopPropagation();
				$('#addNewConfirm').off(touchstart);
				addnew.save();
			});
			return false;
		}
		/////////////////
		// FORMAT DATA //
		/////////////////
		// IF NULL/EMPTY, JUST REVERT TO 0
		if (addnew.pro == ''|| isNaN(addnew.pro)) {
			addnew.pro = 0;
		}
		if (addnew.car == '' || isNaN(addnew.car)) {
			addnew.car = 0;
		}
		if (addnew.fat == '' || isNaN(addnew.fat)) {
			addnew.fat = 0;
		}
		if (addnew.fii == '' || isNaN(addnew.fii)) {
			addnew.fii = 0;
		}
		if (addnew.sug == '' || isNaN(addnew.sug)) {
			addnew.sug = 0;
		}
		if (addnew.sod == '' || isNaN(addnew.sod)) {
			addnew.sod = 0;
		}
		//revert to 100g
		if (addnew.type == 'food') {
			addnew.kcal = Math.round((addnew.kcal / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.pro  = Math.round((addnew.pro  / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.car  = Math.round((addnew.car  / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.fat  = Math.round((addnew.fat  / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.fii  = Math.round((addnew.fii  / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.sug  = Math.round((addnew.sug  / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.sod  = Math.round((addnew.sod  / $('#inputNewAmount').val()) * 100 * 100) / 100;
			addnew.kcal = Math.round(addnew.kcal);
		} else {
			addnew.kcal = decimalize(addnew.kcal);
		}
		//DECIMALIZE
		addnew.pro = decimalize(addnew.pro);
		addnew.car = decimalize(addnew.car);
		addnew.fat = decimalize(addnew.fat);
		addnew.fii = decimalize(addnew.fii);
		addnew.sug = decimalize(addnew.sug);
		addnew.sod = decimalize(addnew.sod);
		////////////////////
		// SAVE NEW ENTRY //
		////////////////////
		setFood(addnew, function () {
			$('#addNewConfirm').addClass('done');
			////////////
			// UPDATE //
			////////////
			if (addnew.act == 'update') {
				if ((/0000|exercise/).test(addnew.type)) {
					addnew.kcal = Math.round(((addnew.kcal * addnew.totalweight) / 60) * 30);
				}
				//MULTIPLE UNIQUE ~ USE ID AS CLASS
				$('.' + addnew.id + ' .foodName').html2(addnew.name);
				$('.' + addnew.id + ' .foodKcal').html2('<span class="preSpan">' + LANG.KCAL[lang] + '</span>' + addnew.kcal + '</span>');
				$('.' + addnew.id + ' .foodPro').html2('<span class="preSpan">'  + LANG.PRO[lang]  + '</span>' + addnew.pro  + '</span>');
				$('.' + addnew.id + ' .foodCar').html2('<span class="preSpan">'  + LANG.CAR[lang]  + '</span>' + addnew.car  + '</span>');
				$('.' + addnew.id + ' .foodFat').html2('<span class="preSpan">'  + LANG.FAT[lang]  + '</span>' + addnew.fat  + '</span>');
				//HIGHTLIGHT UPDATED
				setTimeout(function() {
					addnew.close();
					app.handlers.highlight('.' + addnew.id);
				}, 25);
			} else {
			/////////////////////
			// INSERT NEW ITEM //
			/////////////////////
				updateCustomList('fav');
				updateCustomList('items');
				//REDO SEARCH
				if ($('#searchContents').html()) {
					if ((/0000|exercise/).test(addnew.type) && !$('#foodSearch').hasClass('exerciseType')) {
						$('#iconRefresh').trigger(touchstart);
					} else if (!(/0000|exercise/).test(addnew.type) && $('#foodSearch').hasClass('exerciseType')) {
						$('#iconRefresh').trigger(touchstart);
					}
					doSearch($('#foodSearch').val());
				}
				//HIGHLIGHT NEW
				setTimeout(function() {
					addnew.close();
					app.handlers.highlight('.' + addnew.id);
					if (!app.read('lastInfoTab','topBarItem-3')) {
						app.highlight('#topBarItem-3','rgba(255,200,0,0.8)','#fff',800);
					}
				}, 25);

			}
		});
	};
	///////////////
	// CORE HTML //
	///////////////
	var saveAsNew = (addnew.act == 'update') ? '<div id="saveAsNew">' + LANG.SAVE_AS_NEW[lang] + '</div>' : '';
	var addNewCoreHtml = '\
	<div id="addNewListWrapper">\
		<div id="addNewWrapper">\
			<ul id="addNewList">\
				<li id="addNewName">  <label>' + LANG.ADD_NAME[lang].capitalize()   + '</label>                         <input tabindex="3" type="text"   id="inputNewName"                /></li>\
				<li id="addNewAmount"><label>' + LANG.ADD_AMOUNT[lang].capitalize() + ' (' + LANG.G[lang] + ')</label>  <input tabindex="3" type="number" id="inputNewAmount"  value="100" /></li>\
				<li id="addNewKcal">  <label>' + LANG.KCAL[lang].capitalize()       + '</label>                         <input tabindex="3" type="number" id="inputNewKcal"    value="0"   /></li>\
				<li id="addNewPro">   <label>' + LANG.PRO[lang].capitalize()        + '</label>                         <input tabindex="3" type="number" id="inputNewPro"     value="0"   /></li>\
				<li id="addNewCar">   <label>' + LANG.CAR[lang].capitalize()        + '</label>                         <input tabindex="3" type="number" id="inputNewCar"     value="0"   /></li>\
				<li id="addNewFat">   <label>' + LANG.FAT[lang].capitalize()        + '</label>                         <input tabindex="3" type="number" id="inputNewFat"     value="0"   /></li>\
				<li id="addNewFii">   <label>' + LANG.FIB[lang].capitalize()        + '</label>                         <input tabindex="3" type="number" id="inputNewFii"     value="0"   /></li>\
				<li id="addNewSug">   <label>' + LANG.SUG[lang].capitalize()        + '</label>                         <input tabindex="3" type="number" id="inputNewSug"     value="0"   /></li>\
				<li id="addNewSod">   <label>' + LANG.SOD[lang].capitalize()        + ' (' + LANG.MG[lang] + ')</label> <input tabindex="3" type="number" id="inputNewSod"     value="0"   /></li>\
			</ul>\
		</div>\
	</div>\
		<div id="addNewCancel">' + LANG.CANCEL[lang] + '</div>\
		<div id="addNewConfirm">' + LANG.SAVE[lang] + '</div>\
		' + saveAsNew + '\
	</div>';
	//////////////////////////////
	// INSERT ? UPDATE WRAPPER //
	//////////////////////////////
	if($('#modalWrapper').length) {
		$('#modalOverlay').off();
		$('#modalWrapper').append2(addNewCoreHtml);
		$('#addNewListWrapper,#addNewCancel,#addNewConfirm').hide();

		app.handlers.fade(0,'#modalConversions');
		app.handlers.fade(0,'#modalWindow',function() {
			app.handlers.fade(1,'#addNewListWrapper,#addNewCancel,#addNewConfirm');
		});
	} else {
		//CREATE NEW
		$('body').append2('<div id="modalWrapper"><div id="modalOverlay"></div>' + addNewCoreHtml + '</div>');
		$('#addNewWrapper,#addNewCancel,#addNewConfirm').hide();

		if($('#foodSearch').val() != '') {
			$('#inputNewName').val( $('#foodSearch').val() );
		}

		$('#modalWrapper').show();
		$('#addNewWrapper').show();
		$('#addNewWrapper,#addNewCancel,#addNewConfirm').show();
		app.handlers.fade(1,'#modalWrapper, #addNewWrapper');
	}
	getNiceScroll('#addNewWrapper',200);
	////////////////
	// ADD/REMOVE //
	////////////////
	app.handlers.addRemove('#inputNewAmount',0,999,'int');
	app.handlers.addRemove('#inputNewKcal',0,9999,'int');
	app.handlers.addRemove('#inputNewPro',0,999,'dec');
	app.handlers.addRemove('#inputNewCar',0,999,'dec');
	app.handlers.addRemove('#inputNewFat',0,999,'dec');
	app.handlers.addRemove('#inputNewFii',0,999,'dec');
	app.handlers.addRemove('#inputNewSug',0,999,'dec');
	app.handlers.addRemove('#inputNewSod',0,9999,'dec');
	/////////////////////
	// POPULATE INPUTS //
	/////////////////////
	if (addnew.act == 'update') {
		$('#inputNewName').val(addnew.name);
		$('#inputNewKcal').val(Math.round(addnew.kcal));
		$('#inputNewPro').val(decimalize(addnew.pro,-1));
		$('#inputNewCar').val(decimalize(addnew.car,-1));
		$('#inputNewFat').val(decimalize(addnew.fat,-1));
		$('#inputNewFii').val(decimalize(addnew.fii,-1));
		$('#inputNewSug').val(decimalize(addnew.sug,-1));
		$('#inputNewSod').val(decimalize(addnew.sod,-1));
	}
	/////////////////////////////
	// ADJUST FORM TO EXERCISE //
	/////////////////////////////
	if ((/0000|exercise/).test(addnew.type)) {
		$('#addNewAmount label').html2(LANG.MINUTES[lang].capitalize());
		$('#inputNewAmount').val(30);
		$('#addNewPro').hide();
		$('#addNewCar').hide();
		$('#addNewFat').hide();
		$('#addNewFii').hide();
		$('#addNewSug').hide();
		$('#addNewSod').hide();
		if (addnew.act == 'update') {
			$('#inputNewKcal').val(Math.round(((addnew.kcal * addnew.totalweight) / 60) * $('#inputNewAmount').val()));
		}
	}
	///////////////////////////////////////////
	// android input blur blank viewport bug //
	/////////////////////////////////////////// ~ use click instead of tap ~ ios propagation bug
	$('#addNewWrapper input').on('click',function() {
		$(this).focus();
	});
	/*
	if (app.device.android) {
		//preset wrapper min-height
		//$('#addNewWrapper').css2('min-height', $('#addNewWrapper').height() + 'px');
		//trigger on touchmove if not focused (closing-touch white gap)
		$('#addNewWrapper').on('touchmove', function (evt) {
			if (!$('#addNewWrapper input').is(':focus')) {
				//$(window).trigger('orientationchange');
			}
		});
		//trigger if not focused to another input
		var newBlurGap;
		$('#addNewWrapper input').on('blur', function (evt) {
			newBlurGap = setTimeout(function () {
				kickDown();
				//$(window).trigger("orientationchange");
			}, 100);
		});
		$('#addNewWrapper input').on('focus', function (evt) {
			//clearTimeout(newBlurGap);
		});
	}*/
	///////////////////////////
	// autohide keyboard tap //
	///////////////////////////
	$('#addNewWrapper').on(touchstart, function (evt) {
		if (evt.target.id == 'addNewWrapper' || evt.target.id == '') {
			if(!app.device.ios && !app.device.firefoxos) {
				evt.preventDefault();
			}
			evt.stopPropagation();
			$('#addNewWrapper input').trigger('blur');
		}
	});
	////////////////
	// VALIDATION //
	////////////////
	app.handlers.validate('#inputNewKcal,#inputNewAmount',{maxLength:4,allowDots:0});
	app.handlers.validate('#inputNewPro, #inputNewCar, #inputNewFat, #inputNewFii, #inputNewSug, #inputNewSod',{maxLength:7,allowDots:1});
	//////////////
	// HANDLERS //
	//////////////
	//CLOSE
	$('#addNewCancel').on(touchstart, function (evt) {
		evt.stopPropagation();
		addnew.close(evt);
		return false;
	});
	//SAVE
	$('#addNewConfirm').on(touchstart, function (evt) {
		evt.stopPropagation();
		$('#addNewConfirm').off(touchstart);
		addnew.save();
		return false;
	});
	//AS NEW
	$('#saveAsNew').on(touchstart, function (evt) {
		if($('#saveAsNew').hasClass('active')) {
			$('#saveAsNew').removeClass('active');
		} else {
			$('#saveAsNew').addClass('active');
		}
	});
}
//#////////////////////#//
//#    MODAL WINDOW    #//
//#////////////////////#//
function getModalWindow(itemId) {
	'use strict';
	if (!itemId) {
		return;
	}
	///////////////////
	// PREVENT FLOOD //
	///////////////////
	$('#modalWrapper').remove();
	$('#addNewWrapper').remove();
	//////////////
	// GET DATA //
	//////////////
	var modal = {};
	getFood(itemId, function (data) {
		modal = {
			id  : itemId,
			name: data.name,
			type: data.type,
			code: data.code,
			term: data.term,
			kcal: decimalize(data.kcal),
			pro : decimalize(data.pro),
			car : decimalize(data.car),
			fat : decimalize(data.fat),
			fib : data.fib,
			fii : decimalize(data.fii),
			sug : decimalize(data.sug),
			sod : decimalize(data.sod),
		};
		/////////////////////
		// FOOD ? EXERCISE //
		/////////////////////
		var isFoodRow = (modal.type != '0000' && modal.type != 'exercise') ? true : false;
		var totalWeight = app.read('calcForm#pA3B') ? app.read('calcForm#pA3B') : 80;
		if (app.read('calcForm#pA3C','pounds')) {
			totalWeight = Math.round((totalWeight) / (2.2));
		}
		/////////////////////////////
		// MODAL.UPDATENUTRIENTS() //
		/////////////////////////////
		modal.updatenutrients = function() {
			if (isFoodRow) {
				var modalAmount = parseInt($('#modalAmount').val());
				$('#proData').find('p').html2(decimalize((modal.pro/100)*modalAmount,1));
				$('#carData').find('p').html2(decimalize((modal.car/100)*modalAmount,1));
				$('#fatData').find('p').html2(decimalize((modal.fat/100)*modalAmount,1));
				$('#fiiData').find('p').html2(decimalize((modal.fii/100)*modalAmount,1));
				$('#sugData').find('p').html2(decimalize((modal.sug/100)*modalAmount,1));
				$('#sodData').find('p').html2(decimalize((modal.sod/100)*modalAmount,1));
			}
		};
		/////////////////////////
		// MODAL.CHECKACTIVE() //
		/////////////////////////
		modal.checkactive = function() {
			if(parseInt($('#modalTotal').html()) != 0) {
				if(!$('#modalOk').hasClass('active')) {
					$('#modalOk').addClass('active');
				}
			} else {
				$('#modalOk').removeClass('active');
			}
		};
		/////////////////
		// MODAL.ADD() //
		/////////////////
		//STEP GLOBALS
		var addStep = 1;
		var remStep = 1;
		//
		modal.add = function() {
			var modalAmount;
			var modalTotal;
			var lastDigit;
			app.timeout('addStep',200,function() {
				addStep = 1;
			});
			if (isFoodRow) {
				//FOOD
				modalAmount = parseInt($('#modalAmount').val());
				//next 0 or 5
				lastDigit   = modalAmount.toString().split('').pop();
				var smooth = false;
				if(addStep == 5 && lastDigit != 5 && lastDigit != 0) {
					smooth = true;
				}
				modalAmount = modalAmount + (smooth ? 1 : addStep);
				modalTotal  = Math.round((modal.kcal / 100) * modalAmount);
				if (modalAmount <= 999 && modalTotal < 99999) {
					$('#modalAmount').val(modalAmount);
					$('#modalTotal').html2(modalTotal);
					modal.updatenutrients();
					modal.checkactive();
				}
			} else {
				//EXERCISE
				modalAmount = parseInt($('#modalAmount').val()) + 1;
				modalTotal  = Math.round(((modal.kcal * totalWeight) / 60) * modalAmount);
				if (modalAmount <= 999 && modalTotal < 99999) {
					$('#modalAmount').val(modalAmount);
					$('#modalTotal').html2(modalTotal);
					modal.checkactive();
				}
			}
		};
		/////////////////
		// MODAL.REM() //
		/////////////////
		modal.rem = function() {
			var modalAmount;
			var modalTotal;
			var lastDigit;
			app.timeout('remStep',200,function() {
				remStep = 1;
			});
			if (isFoodRow) {
				//next 0 or 5
				modalAmount = parseInt($('#modalAmount').val());
				lastDigit   = modalAmount.toString().split('').pop();
				var smooth = false;
				if(remStep == 5 && lastDigit != 5 && lastDigit != 0) {
					smooth = true;
				}
				//FOOD
				modalAmount = modalAmount - (smooth ? 1 : remStep);
				modalTotal  = Math.round((modal.kcal / 100) * modalAmount);
				
				if(parseInt($('#modalAmount').val()) == '' && parseInt($('#modalTotal').html2(modalTotal)) != 0) {
					modalAmount = 0;
				}
				
				if (modalAmount >= 0) {
					$('#modalAmount').val(modalAmount);
					$('#modalTotal').html2(modalTotal);
					modal.updatenutrients();
					modal.checkactive();
				}
			} else {
				//EXERCISE
				modalAmount = parseInt($('#modalAmount').val()) - 1;
				modalTotal  = Math.round(((modal.kcal * totalWeight) / 60) * modalAmount);
				if (modalAmount >= 0) {
					$('#modalAmount').val(modalAmount);
					$('#modalTotal').html2(modalTotal);
					modal.checkactive();
				}
			}
		};
		////////////////////
		// MODAL.update() //
		////////////////////
		modal.update = function() {
			var modalAmount;
			var modalTotal;
			var lastDigit;
			//app.timeout('remStep',200,function() {
			//	remStep = 1;
			//});
			if (isFoodRow) {
				//next 0 or 5
				modalAmount = parseInt($('#modalAmount').val());
				//FOOD
				//modalAmount = modalAmount - (smooth ? 1 : remStep);
				modalTotal  = Math.round((modal.kcal / 100) * modalAmount);
				if (modalAmount >= 0) {
					$('#modalAmount').val(modalAmount);
					$('#modalTotal').html2(modalTotal);
					modal.updatenutrients();
					modal.checkactive();
				}
			} else {
				//EXERCISE
				modalAmount = parseInt($('#modalAmount').val());
				modalTotal  = Math.round(((modal.kcal * totalWeight) / 60) * modalAmount);
				if (modalAmount >= 0) {
					$('#modalAmount').val(modalAmount);
					$('#modalTotal').html2(modalTotal);
					modal.checkactive();
				}
			}
		};		
		///////////////////
		// MODAL.CLOSE() //
		///////////////////
		modal.close = function(published) {
			app.handlers.fade(0,'#modalWrapper',function() {
				if(published) {
					updateTimer();
					setTimeout(function() {
						app.exec.updateEntries(published);
						updateEntriesTime();
						updateEntriesSum();
						intakeHistory();
						setPush();
					}, 1000);
				}
			});
			$('div.activeOverflow').removeClass('activeOverflow');
			clearTimeout(app.repeaterLoop);
		};
		//////////////////
		// MODAL.SAVE() //
		//////////////////
		modal.save = function() {
			/////////////////////
			// FOOD ? EXERCISE //
			/////////////////////
			var saveTitle = isFoodRow ? parseInt($('#modalTotal').html()) : parseInt($('#modalTotal').html()) * -1;
			var saveUnit  = isFoodRow ? LANG.G[lang] : ' ' + LANG.MIN[lang];
			var saveBody  = modal.name + ' (' + $('#modalAmount').val() + saveUnit + ')';
			modal.info    = $('#modalPlanned').hasClass('plannedItem') ? 'planned' : '';
			////////////////
			// ENTRY TIME //
			////////////////
			var saveTime = app.now();
			if(Number($('#entryTime').val()) < 0) {
				//past
				saveTime = saveTime + (Number($('#entryTime').val()) * (60 * 60 * 1000) );
			} else if(Number($('#entryTime').val()) > 0) {
				//schedule
				saveTime = saveTime + (Number($('#entryTime').val()) * (60 * 60 * 1000) );
			}
			if(modal.info == 'planned') {
				saveTime = saveTime + (5000 * 24 * 60 * 60 * 1000);	
			}
			///////////////
			// ADD ENTRY //
			///////////////
			saveEntry({
				title     : saveTitle,
				body      : saveBody,
				published : saveTime,
				type      : modal.type,
				pro       : parseFloat($('#proData p').html()),
				car       : parseFloat($('#carData p').html()),
				fat       : parseFloat($('#fatData p').html()),
				fii       : parseFloat($('#fiiData p').html()),
				sug       : parseFloat($('#sugData p').html()),
				sod       : parseFloat($('#sodData p').html()),
				info      : modal.info
			},function() {
				$('#addNewConfirm').addClass('done');
				//////////////
				// CALLBACK //
				//////////////
				////////////////////////
				// UPDATE RECENT LIST //
				////////////////////////
				var recentArray = app.read('app_recent_items','','object');
				if(recentArray.contains(itemId)) {
					//UPDATE EXISTING
					var r = recentArray.length;
					while(r--) {
						if(recentArray[r].id == '#' + itemId + '#') {
							//UPDATE TIME
							recentArray[r].time = app.now();
							//UPDATE COUNT
							if(!recentArray[r].count) {
								recentArray[r].count = 1;
							} else {
								recentArray[r].count = recentArray[r].count + 1;
							}
							//FOUND, STOP
							break;
						}
					}
				} else {
					//INSERT NEW
					recentArray.push({id: '#' + itemId + '#', time: app.now(), count: 1});
				}
				//SORT
				var orderCut = recentArray.sortbyattr('time', 'desc');
				//WRITE
				app.save('app_recent_items',orderCut.slice(0,100),'object');
				///////////////////////
				// PROMPT AUTO START //
				///////////////////////
				if (!app.read('appStatus','running')) {
					appConfirm(LANG.NOT_RUNNING_TITLE[lang], LANG.NOT_RUNNING_DIALOG[lang], function(button) {
						if (button === 2) {
							app.save('config_start_time',saveTime);
							app.save('appStatus','running');
							$('#appStatusTitle').html2(LANG.RESET[lang]);
							$('#appStatus').removeClass('start');
							$('#appStatus').addClass('reset');
							app.exec.updateEntries(saveTime);
							setPush();
						}
					}, LANG.OK[lang], LANG.CANCEL[lang]);
				}
				setTimeout(function() {
					//FADE OUT
					modal.close(saveTime);
					//HIGHLIGHT
					app.handlers.highlight('.' + modal.id);
					//UPDATE TODAY'S
					setTimeout(function() {
						updateTodayOverview();
						intakeHistory();
					},1000);
				},25);
			});
		};
		/////////////////
		// MODAL.FAV() //
		/////////////////
		modal.fav = function() {
			//TOGGLE STYLE
			if($('.' + modal.id).hasClass('favItem')) {
				$('.' + modal.id).removeClass('favItem');
				$('#modalFav').removeClass('favorite');
				modal.fib = 'nonFav';
			} else {
				$('.' + modal.id).addClass('favItem');
				$('#modalFav').addClass('favorite');
				modal.fib = 'fav';
			}
			//UPDATE DB
			setFav(modal,function() {
				updateCustomList('fav');
				setPush();
			});
		};
		/////////////////////
		// MODAL.PLANNED() //
		/////////////////////
		modal.planned = function() {
			//TOGGLE PLANNED
			if($('#modalPlanned').hasClass('plannedItem')) {
				$('#modalPlanned').removeClass('plannedItem');
			} else {
				$('#modalPlanned').addClass('plannedItem');
			}
		};		
		////////////////////
		// MODAL.REMOVE() //
		////////////////////
		modal.remove = function() {
			appConfirm(LANG.DELETE_ITEM[lang], LANG.ARE_YOU_SURE[lang], function(button) {
				if (button === 2) {
					modal.close();
					setTimeout(function() {
						delFood(modal.id,function() {
							$('.' + modal.id).each(function(row) {
								if ($('#' + $(this).parent('div').prop('id') + ' div.searcheable').length == 1) {
									$(this).parent('div').append2('<div class="searcheable noContent"><div><em>' + LANG.NO_ENTRIES[lang] + '</em></div></div>');
								}
								$('#' + $(this).parent('div').prop('id') + ' .' + modal.id).remove();
							});
						});
						setPush();
					},100);
				}
			}, LANG.OK[lang], LANG.CANCEL[lang]);
		};
		/////////////////////
		// MODAL.PREFILL() //
		/////////////////////
		modal.prefill = function() {
			$('#appContent').show();
			$('#modalContent span').addClass('active');
			modal.close();
			setTimeout(function() {
				appFooter('tab2',0,function() {
					app.suspend('#entryListForm',300);
					$('#entryBody').val(modal.name);
					setTimeout(function () {
						$('#appHeader').trigger(touchstart);
					}, 300);
					$('#entryBody').width($('body').width() - 105);
					app.highlight('#entryBody',1000,'rgba(255,240,0,0.4)');
				});
			},0);
		};
		////////////////
		// HTML FRAME //
		////////////////
		var modalTextOrNumber = app.device.desktop || app.device.android ? 'text' : 'number';
		$('body').append2('\
		<div id="modalWrapper">\
			<div id="modalOverlay"></div>\
			<div id="modalWindow">\
				<div id="modalDelete"></div>\
				<div id="modalEdit"></div>\
				<div id="modalFav"></div>\
				<div id="modalPlanned"></div>\
				<div id="modalContent">'     + modal.name        + '&nbsp; <span>&nbsp;' + LANG.PRE_FILL[lang] + '</span></div>\
				<div id="modalButtons">\
					<span id="modalOk">'     + LANG.ADD[lang]    + '</span>\
					<span id="modalCancel">' + LANG.CANCEL[lang] + '</span>\
				</div>\
				<div id="modalAdjust">\
					<span id="modalNegBlock"><span id="modalNeg"></span></span>\
					<span id="modalPosBlock"><span id="modalPos"></span></span>\
					<span id="modalAmountBlock"><input type="' + modalTextOrNumber + '" id="modalAmount" value="0" />\
					<span id="modalAmountType">' + LANG.MINUTES[lang] + '</span></span>\
					<span id="modalTotalBlock"><span id="modalTotal">0</span><span id="modalTotalType">'    + LANG.KCAL[lang]    + '</span></span>\
				</div>\
			</div>\
		</div>');
		////////////////////
		// + FOOD DETAILS //
		////////////////////
		if (isFoodRow) {
			$('#modalAmountType').html2(LANG.GRAMS[lang]);
			$('#modalTotalType').after2('\
				<span id="proData"><p>0.0</p><span>' + LANG.G[lang] + '</span></span>\
				<span id="carData"><p>0.0</p><span>' + LANG.G[lang] + '</span></span>\
				<span id="fatData"><p>0.0</p><span>' + LANG.G[lang] + '</span></span>\
				<span id="fiiData"><p>0.0</p><span>' + LANG.G[lang] + '</span></span>\
				<span id="sugData"><p>0.0</p><span>' + LANG.G[lang] + '</span></span>\
				<span id="sodData"><p>0.0</p><span>' + LANG.MG[lang] + '</span></span>\
				<span id="proLabel">' + LANG.PRO[lang] + '</span>\
				<span id="carLabel">' + LANG.CAR[lang] + '</span>\
				<span id="fatLabel">' + LANG.FAT[lang] + '</span>\
				<span id="fiiLabel">' + LANG.FIB[lang] + '</span>\
				<span id="sugLabel">' + LANG.SUG[lang] + '</span>\
				<span id="sodLabel">' + LANG.SOD[lang] + '</span>\
			');
			//APROX CONVERSIONS
			$('#modalWrapper').append2('\
			<div id="modalConversions">\
				<div id="modalConversionsTitle">' + LANG.APROX_CONVERSIONS[lang]  + '</div>\
				<div><span>1 ' + LANG.ML[lang]         + '</span><span> = </span><span>1'   + LANG.G[lang] + '</span></div>\
				<div><span>1 ' + LANG.TEASPOON[lang]   + '</span><span> = </span><span>5'   + LANG.G[lang] + '</span></div>\
				<div><span>1 ' + LANG.TABLESPOON[lang] + '</span><span> = </span><span>15'  + LANG.G[lang] + '</span></div>\
				<div><span>1 ' + LANG.CUP[lang]        + '</span><span> = </span><span>240' + LANG.G[lang] + '</span></div>\
				<div><span>1 ' + LANG.OZ[lang]         + '</span><span> = </span><span>28'  + LANG.G[lang] + '</span></div>\
				<div><span>1 ' + LANG.LB[lang]         + '</span><span> = </span><span>454' + LANG.G[lang] + '</span></div>\
			</div>');
		}
		//READ STORED
		if (modal.fib == 'fav') {
			$('#modalFav').addClass('favorite');
		}
		//////////
		// SHOW //
		//////////
		app.handlers.fade(1,'#modalWrapper',function() {
			//////////////
			// HANDLERS //
			//////////////
			// VALIDATE MANUAL INPUT //
			app.handlers.validate('#modalAmount',{maxLength:3,inverter:0},'',function() {
				//KEYUP
				modal.update();
			},function() {
				//FOCUS
				modal.update();
				//
				if($('#modalAmount').val() == '' || $('#modalAmount').val() == 0) {
					$('#modalAmount').val(''); 
				}
			},function() {
				//BLUR
				//$('#modalAmount').attr('type','text');
				//$('#modalAmount').attr('readonly','readonly');
				if($('#modalAmount').val() == '') {
					//$('#lid').val(0);
					$('#modalAmount').val(0);
					//document.getElementById('slider').slider.setValue(0);
				}
				modal.update();
				//modal.updatenutrients();
			});
			// STEP CHANGER //
			$('#modalNeg').on('hold',function(evt) {
				remStep = 5;
			});
			$('#modalPos').on('hold',function(evt) {
				addStep = 5;
			});
			//REPEATERS
			app.handlers.repeater('#modalNegBlock', 'active', 400, isFoodRow ? 50 : 50, function() {
				modal.rem();
			});
			app.handlers.repeater('#modalPosBlock', 'active', 400, isFoodRow ? 50 : 50, function() {
				modal.add();
			});
			//SAVE
			$('#modalOk').on(touchstart, function (evt) {
				evt.preventDefault();
				evt.stopPropagation();
				if(parseInt($('#modalTotal').html()) != 0) {
					$('#modalOk').off();
					modal.save();
				}
			});
			//CANCEL
			$('#modalOverlay, #modalCancel').on(touchstart, function (evt) {
				modal.close();
			});
		});
		//faster button
			//FIX PROPAGATION
			$('#modalWindow').on(touchmove, function (evt) {
				evt.preventDefault();
				evt.stopPropagation();
			});
			if (app.device.wp8) {
				$('#modalWindow').on(touchstart, function (evt) {
					evt.stopPropagation();
				});
			}
			//EDIT
			//$('#modalEdit').on(touchend, function (evt) {
			app.handlers.activeRow('#modalEdit','button',function(evt) {
				addNewItem(modal);
			});
			//FAV
			//$('#modalFav').on(touchend, function (evt) {
			app.handlers.activeRow('#modalFav','button',function(evt) {
				modal.fav();
			});
			app.handlers.activeRow('#modalPlanned','button',function(evt) {
				modal.planned();
			});
			//DELETE
			//$('#modalDelete').on(touchend, function (evt) {
			app.handlers.activeRow('#modalDelete','button',function(evt) {
				modal.remove();
			});
			//PREFILL
			//$('#modalContent').on(touchend, function (evt) {
			app.handlers.activeRow('#modalContent','button',function(evt) {
				modal.prefill();
			});
	});
}

