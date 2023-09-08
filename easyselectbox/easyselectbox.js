/*
 * Easy Select Box 1.0.7
 * https://github.com/kosinix/easyselectbox
 * Replace select with div for easy styling via css.
 * Features: multiple instances, initial value specified by selected attribute, optional classNames, optional speed, callback onClick, callback onBuildList
 * Tested: IE7, IE8, Chrome 10, FF3, Safari 3.2 windows, Opera 11
 * 
 * Copyright 2012, Nico Amarilla
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($){
	var timer = null;
	var methods = {
		init : function( options ) {
			//Settings list and the default values
			var defaults = {
				classNames:{selectbox:'',displayer:'esb-displayer',dropdown:'esb-dropdown',item:'esb-item'},
				disabled:false, //true to disable select,
				onBuildList:null,//callback after dropdown items are built. Can be used for customized dropdown items appearance.
				onClick:null,//callback when easySelect is clicked. Param data contains data.value and data.text
				speed:0 //speed of opening and closing drop down in ms
			};
			options = $.extend(true, {}, defaults, options);
			
			return this.each(function() {
				var selectObj = $(this);//jquery object of our select element
				
				if('select'!=selectObj[0].nodeName.toLowerCase()){//check if its a <select> tag
					$.error( 'Not a SELECT element on jQuery.easySelectBox' );
				} else {
					var lists = selectObj.children('option');
					var easySelect = null;//the displayer element
					var easySelectDropdown = null;//the dropdown element
					var initialVal = selectObj.val();
					var className = options.classNames.selectbox;
					var displayerClass = options.classNames.displayer;
					var dropdownClass = options.classNames.dropdown;
					var itemClass = options.classNames.item;
					var initIndex = 0;
					
					//construct html
					var displayerHtml = '';
					var dropdownHtml = '';
					
					//loop thru each <option> elements
					$.each(lists, function(i, el){
						text = $(el).text();
						if(text==''){
							text = '&nbsp;';
						}
						dropdownHtml += '<div class="'+itemClass+'">'+text+'</div>';//place text
						if(initialVal==$(el).val()){
							initIndex = i;
						}
					});
					dropdownHtml = '<div class="'+dropdownClass+'">'+dropdownHtml+'</div>';
					displayerHtml = '<div class="'+displayerClass+'">'+lists.eq(initIndex).text()+'</div>';
					
					if(options.onBuildList!=null){
						dropdownHtml = options.onBuildList.call(this, {'selectObj':selectObj, 'options':options, 'lists':lists, 'initialVal':initialVal});
					}
					
					easySelectHtml = '<div tabindex="0" class="easy-select-box '+className+'">'+displayerHtml+dropdownHtml+'</div>';
					
					//add to dom
					easySelect = $(easySelectHtml).insertAfter(selectObj);
					easySelect.addClass('easy-select-'+$('body').find('.easy-select-box').index(easySelect));//add a class based on selectbox count
					
					
					//easySelectBox parts
					displayer = easySelect.children('.'+displayerClass);
					dropdown = easySelect.children('.'+dropdownClass);
					
					//add structural css. Separates it from presentation css found in easySelect css file
					_addStructuralCss(selectObj, easySelect, dropdown, displayer);
					
					selectObj.hide();//hide the select element
					
					//store all needed data
					selectObj.data('easySelect', easySelect);//save the easySelectBox element associated with a select element
					easySelect.data('easySelectData', {'options':options, 'selectObj':selectObj, 'displayer':displayer, 'dropdown':dropdown, 'timer':null});
					
					if(selectObj.attr('disabled') || options.disabled){
						easySelect.addClass('disabled');
					} else {
						easySelect.bind('click.easyselectbox', _click);
						easySelect.bind('focusin.easyselectbox', _focusin);
						easySelect.bind('focusout.easyselectbox', _focusout);
					}
					
					
				}
			});
		},
		option : function(type, value) {
			//getter
			if(type=='value'){
				if(value==undefined){
					 return $(this).val();
				} 
			}
			if(type=='speed'){
				if(value==undefined){
					var selectObj = $(this);//jquery object of our select element
					var easySelect = selectObj.data('easySelect');
					var easySelectData = easySelect.data('easySelectData');
					var options = easySelectData.options;
		
					return options.speed;
				}
				
			}
			
			//setter
			return this.each(function() {
				var selectObj = $(this);//jquery object of our select element
				var easySelect = selectObj.data('easySelect');
				
				if(easySelect==undefined){
					$.error( 'easySelectBox not initialized yet.' );
				} else {
					var easySelectData = easySelect.data('easySelectData');
					var displayer = easySelectData.displayer;
					var dropdown = easySelectData.dropdown;
					var options = easySelectData.options;
					
					if(type=='value'){
						if(value!=undefined){
							selectObj.val(value);
							var i = selectObj.find('option:selected').index();
							_updateSelect(selectObj, i);
						}
					} else if(type=='index'){
						if(value!=undefined){
							_updateSelect(selectObj, value);
						}
					} else if(type=='speed'){//set speed
						if(value!=undefined){
							easySelectData.options.speed = value;
							easySelect.data('easySelectData', easySelectData);
						}
					} else if(type=='disabled'){
						if(value!==undefined){
							if(value==false){
								
								easySelect.removeClass('disabled');
								
								easySelect.bind('click.easyselectbox', _click);
								easySelect.bind('focusin.easyselectbox', _focusin);
								easySelect.bind('focusout.easyselectbox', _focusout);
						
							} else {
								easySelect.addClass('disabled');
								
								easySelect.unbind('click.easyselectbox');
								easySelect.unbind('focusin.easyselectbox');
								easySelect.unbind('focusout.easyselectbox');
							}
						}
					}
				}

			});
		},
		//persistent - true|false - if true, dropdown will remain open until explicitly closed using close method.
		open : function(persistent) {
			return this.each(function() {
				var selectObj = $(this);//jquery object of our select element
				var easySelect = selectObj.data('easySelect');
				
		
				if(easySelect==undefined){
					$.error( 'easySelectBox not initialized yet.' );
				} else {
					var easySelectData = easySelect.data('easySelectData');
					var selectObj = easySelectData.selectObj;
					var displayer = easySelectData.displayer;
					var dropdown = easySelectData.dropdown;
					var options = easySelectData.options;
					
					if(persistent==null||persistent==false){
						easySelect.focus();
					}
					
					if(!dropdown.is(':visible')){
						_open(dropdown, options.speed);
					}
				}

			});
		},
		close : function() {
			return this.each(function() {
				var selectObj = $(this);//jquery object of our select element
				var easySelect = selectObj.data('easySelect');
				
				if(easySelect==undefined){
					$.error( 'easySelectBox not initialized yet.' );
				} else {
					var easySelectData = easySelect.data('easySelectData');
					var selectObj = easySelectData.selectObj;
					var displayer = easySelectData.displayer;
					var dropdown = easySelectData.dropdown;
					var options = easySelectData.options;
					
					if(dropdown.is(':visible')){
						_close(dropdown, options.speed);
					}
				}

			});
		},
		//text - string - selects the option with the given text. Case sensitive.
		//useValue - true|false - selects the option with the value attribute equals to param text. Defaults to false.
		select : function(text, useValue) {
			return this.each(function() {
				var selectObj = $(this);//jquery object of our select element
				var easySelect = selectObj.data('easySelect');
				
				if(easySelect==undefined){
					$.error( 'easySelectBox not initialized yet.' );
				} else {
					var easySelectData = easySelect.data('easySelectData');
					var selectObj = easySelectData.selectObj;
					var displayer = easySelectData.displayer;
					var dropdown = easySelectData.dropdown;
					var options = easySelectData.options;
					if(useValue==undefined || useValue==null){
						useValue = false;
					}
					
					var index = -1;
					if(useValue==true){
						index = selectObj.find('option[value="'+text+'"]').index();//find option with this value
					} else {
						if(text==''){//if text empty find option with empty text
							index = selectObj.find('option:empty').index();
						} else {//find option containing text
							selectObj.find('option').each(function(i){
								if($(this).html() == text){
									index = i;
									return;
								}
							});
						}
					}
					_updateSelect(selectObj, index);
				}

			});
		}
	};
	/*** Plugin Main ***/
	$.fn.easySelectBox = function(method) {
		
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.easySelectBox' );
		}
		return false;
	}
	/*** Private Functions ***/
	function _click(e) {
		var easySelect = $(this);//$(this) refers to easySelect element
		var easySelectData = easySelect.data('easySelectData');
		var selectObj = easySelectData.selectObj;
		var displayer = easySelectData.displayer;
		var dropdown = easySelectData.dropdown;
		var options = easySelectData.options;
		
		//alert($(e.target));
		if($(e.target).get(0)==displayer.get(0) || $(e.target).get(0)==easySelect.get(0)){

			if(dropdown.is(':visible')){
				_close(dropdown, options.speed);
			} else {
				_open(dropdown, options.speed);
			}
		} else if($(e.target).is('.'+options.classNames.item)){//esb item is clicked
			var index = dropdown.find('.'+options.classNames.item).index($(e.target));
			
			_updateSelect(selectObj, index);
			
			if(options.onClick!=null){
				options.onClick.call(this, {'value':selectObj.val(), 'text':selectObj.find('option').eq(index).html()});
			}
			
		} else if($('.'+options.classNames.item).has($(e.target)).length>0){//cufon text fix. Will also detect if a descendant of esb item was clicked
			var index = dropdown.find('.'+options.classNames.item).index($(e.target).parents('.'+options.classNames.item));
			
			_updateSelect(selectObj, index);
			
			if(options.onClick!=null){
				options.onClick.call(this, {'value':selectObj.val(), 'text':selectObj.find('option').eq(index).html()});
			}
			
		}
		
		e.stopPropagation();
	}
	function _open(dropdown, speed){
		dropdown.slideDown(speed);
	}
	function _close(dropdown, speed){
		dropdown.slideUp(speed);
	}
	function _focusin(e){
		var easySelect = $(this);//$(this) refers to easySelect element
		var easySelectData = easySelect.data('easySelectData');
		var selectObj = easySelectData.selectObj;
		var displayer = easySelectData.displayer;
		var dropdown = easySelectData.dropdown;
		var options = easySelectData.options;
		
		easySelect.addClass('focused');
		//we delay closing a bit. Fix for IE7 bug
		window.clearTimeout(easySelectData.timer);
		
		e.stopPropagation();
	}
	function _focusout(e){
		var easySelect = $(this);//$(this) refers to easySelect element
		var easySelectData = easySelect.data('easySelectData');
		var selectObj = easySelectData.selectObj;
		var displayer = easySelectData.displayer;
		var dropdown = easySelectData.dropdown;
		var options = easySelectData.options;
		
		easySelect.removeClass('focused');
		
		if(dropdown.is(':visible')){
			//we delay closing a bit. Fix for IE7 bug
			easySelectData.timer = window.setTimeout(function(){
				_close(dropdown, options.speed);
			},100);
			easySelect.data('easySelectData',easySelectData);
		}
		
		e.stopPropagation();
	}
	
	function _updateSelect(selectObj, index){
		var easySelect = selectObj.data('easySelect');
		var easySelectData = easySelect.data('easySelectData');
		var displayer = easySelectData.displayer;
		var dropdown = easySelectData.dropdown;
		var options = easySelectData.options;
		
		//update easySelect
		var selectedOption = selectObj.find('option').eq(index);
		displayer.html(selectedOption.html());
		
		//update select
		selectObj.find('option').removeAttr('selected');
		selectedOption.attr('selected','selected');
		
		if(dropdown.is(':visible')){
			_close(dropdown, options.speed);
		}
	}
	
	//css that makes the structure of easySelect. Separates it from presentation css found in easySelect css file css.
	function _addStructuralCss(selectObj, easySelect, dropdown, displayer){
		easySelect.css({
			width:displayer.outerWidth()
		});
		borderWidth = parseInt(dropdown.css("border-left-width"), 10) + parseInt(dropdown.css("border-right-width"), 10);
		dropdown.css({
			width:easySelect.width()-borderWidth
		});
	}
})(jQuery);