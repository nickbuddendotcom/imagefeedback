;(function ( $, window, document, undefined ) {

  $.widget( "nb.imageFeedback" , {

    //Options to be used as defaults
    options: {
      commentNum: 0,
      isDragging: false,
      isResizing: false
    },

    _create: function () {
    	var _this        = this,
    			$element     = _this.element,
    			$wrap        = $element.wrapAll("<div class='jquery-annotate-wrap' />").parent(),
    			isDragging   = false,
    			wasDragging,
    			mousedownX,
    			mousedownY,
    			mouseChangeX,
    			mouseChangeY;

			// Don't drag the image
    	$element.on('dragstart', function(e) {
    		e.preventDefault();
    	});

    	// Differentiate between a click and a drag, and
    	// fire a different event for each
			// http://stackoverflow.com/a/4139860/740836
			$element.mousedown(function(e) {
				mousedownX = e.offsetX;
				mousedownY = e.offsetY;

				// If this is a drag
		    $(window).mousemove(function(e) {
	        isDragging = true;
	        mouseChangeX = Math.abs( Math.abs(mousedownX) - Math.abs(e.offsetX) );
	        mouseChangeY = Math.abs( Math.abs(mousedownY) - Math.abs(e.offsetY) );

	        // Make them drag at least 8px before we create our box
	        if(mouseChangeX >= 8 || mouseChangeY >= 8) {
	        	$(window).unbind("mousemove");
    				_this.setActiveMarker( _this.addMarker(e, mouseChangeX, mouseChangeY) );
	        }
		    });

			}).mouseup(function(e) {
			    wasDragging = isDragging;
			    isDragging = false;
			    $(window).unbind("mousemove");

			    // If this was a click (and not a drag)
			    if (!wasDragging) {
			    	_this.setActiveMarker( _this.addMarker(e) );
			    }
			});

    },

    addMarker: function(e, width, height) {
    	var _this      = this,
    			$element   = _this.element;
    			offsetX    = e.offsetX,
    			offsetY    = e.offsetY,
    			startDrag  = false,
    			commentNum = _this._setOption( 'commentNum', _this.options.commentNum + 1 ),
					$marker    = $(_this.markerHTML(_this.options.commentNum));

			// If width hasn't been set, set to 50 and
			// center box my moving offset half the size
			// Note that width/height aren't set on drag,
			// so we start that event here
			if(typeof width === "undefined") {
				width = 50;
				offsetX = offsetX - 25;
			} else {
				startDrag = true;
			}

			// Same as above
			if(typeof height === "undefined") {
				height = 50;
				offsetY = offsetY - 25;
			} else {
				startDrag = true;
			}

			$marker.css({
    		left: offsetX,
    		top: offsetY,
    		width: width,
    		height: height
    	})
    	.appendTo($element.parent())
    	.draggable({
				containment: 'parent',
				opacity: 0.5,
				start: function( e, ui ) {
					_this._setOption('isDragging', true);
					_this.hideComment( $(this) );
				},
				stop: function( e, ui ) {
					_this._setOption('isDragging', false);
					_this.showComment( $(this) );
				}
			})
			.resizable({
				handles: 'se, sw',
				// TODO: get rid of the $marker reference, and put the parent into an option
				containment: $marker.parent(),
				start: function( e, ui ) {
					_this._setOption('isResizing', true);
					_this.hideComment( $(this) );
				},
				stop: function( e, ui ) {
					_this._setOption('isResizing', false);

					// TODO: cache $bubble
					// This replaces the bubble's
					// Refactor this section...
					var $bubble = $(this).find('.jquery-annotate-bubble');
					$bubble.css('top', $(this).height() + 5);

					_this.showComment( $(this) );
				}
	    })
	    .on('click', function(e) {
	    	// TODO: this section isn't working....
				_this.setActiveMarker( $(this) );
	    })
	    .on('mouseover', function(e) {
	    	if(!_this.options.isResizing && !_this.options.isDragging) {
		    	_this.showComment( $(this) );
	    	}
	    })
	    .on('mouseout', function(e) {
	    	// TODO: is comment bubble visible condition (?)
		    	_this.hideComment( $(this) );
	    });

			// Handle clicking the "X"
			$marker.find('.jquery-annotate-delete').on('click', function(e) {
				e.preventDefault();
				_this.deleteMarker( $(this).closest('.jquery-annotate-comment-wrap') );
			});

			if(startDrag) {
				_this.simulateHandleEvent($marker, "se", e);
			}

			return $marker;
    },

    // My delete func...
    deleteMarker: function($marker) {
    	var _this = this,
    			markerID = parseInt($marker.attr('id').replace("jquery-annotate-comment-wrap-",""), 10);

    	// If this was not the most recently added one, we need to decrement
    	// every higher number'd marker's number by 1
    	if(markerID !== _this.options.commentNum) {
    		while(markerID <= _this.options.commentNum) {
    			$("#jquery-annotate-comment-wrap-" + (markerID + 1))
    				.attr('id', "jquery-annotate-comment-wrap-" + markerID)
    				.find(".jquery-annotate-number").html(markerID);

    			markerID++;
    		}
    	}

    	this._setOption('commentNum', (this.options.commentNum - 1) );
    	$marker.remove();
    },

    // Show the comment bubble...
    showComment: function($marker) {
    	// TODO: isDragging and isResizing goes into options...so that I can return from here
    	$marker.addClass('jquery-annotate-comment-hover');
    },

    // Hide the comment bubble...
    // TODO: add logic for showing/hiding the comment form portion to this and above...
    hideComment: function($marker) {
    	$marker.removeClass('jquery-annotate-comment-hover');
    },

    // Set the active marker
    setActiveMarker: function($marker) {

			// $marker.addClass('jquery-annotate-comment-edit');

			/* Leaving off:
					- Getting my .jquery-annotate-comment-edit and .jquery-annotate-comment-hover classes toggled correctly
					  for different behavior. After that works properly, do the comment numbering inc/dec. After that, Refactor
					  a bit then add some change callbacks where I can write ajax to save stuff
			*/

    	// Ok come back to this. I want to have active and active-editing classes and show/hide based on that. My clicking
    	// functions should toggle based on that....



    	// var activeClass = 'jquery-annotate-active-marker';

    	// $marker.addClass(activeClass);
    	// console.log($marker.hasClass(activeClass));

    	// if($marker.hasClass(activeClass)) {
    	// 	return;
    	// }

    	// console.log('doesnt have active');

    	// if(!$marker.hasClass(activeClass)) {
	    // 	$(".jquery-annotate-comment-wrap").not($marker)
	    // 		.removeClass(activeClass)
	    // 		.find(".jquery-annotate-bubble")
	    // 		.hide();

	    // 	$marker.addClass(activeClass)
	    // 		.find(".jquery-annotate-bubble")
	    // 		.show();
    	// }
    },

    markerHTML: function(num) {
    	return [
    		"<div id='jquery-annotate-comment-wrap-", num, "' class='jquery-annotate-comment-wrap'>",
	    		"<div class='jquery-annotate-comment'>",
	    			"<div class='jquery-annotate-bubble'>",
		    			"<p>", "I'm a comment. Rainbow fucking unicorns. Fuck yeah. Code. Synergy. Fuck. Unicorns.", "</p>",
		    			"<form action='' method='post'>",
		    				"<textarea>I'm a comment. Rainbow fucking unicorns. Fuck yeah. Code. Synergy. Fuck.</textarea>",
		    				"<input type='submit' value='OK' />",
		    			"</form>",
	    			"</div>",
    				"<div class='jquery-annotate-number'>", num, "</div>",
    				"<a class='jquery-annotate-delete' href='#!'>X</a>",
    			"</div>",
	    	"</div>"
    	].join("");
    },

    // When we create a new comment by dragging over the image, we
    // want to programatically trigger the jquery ui resizable handle
    // at the same time
    // http://stackoverflow.com/a/19768036/740836
		simulateHandleEvent: function($item, handle, event){
		  $item.find(".ui-resizable-" + handle)
		    .trigger("mouseover")
		    .trigger({
		      type: "mousedown",
		      which: 1,
		      pageX: event.pageX,
		      pageY: event.pageY
		  });
		},


		// TODO: serialization function


    // Destroy an instantiated plugin and clean up
    // modifications the widget has made to the DOM
    _destroy: function () {},

    // Respond to any changes the user makes to the
    // option method
    _setOption: function ( key, value ) {
      switch (key) {
    	// TODO: delete this if not needed
    	// TODO: This is where I can renumber things after deletion...
      case "someValue":
          //this.options.someValue = doSomethingWith( value );
          break;
      default:
          this.options[ key ] = value;
          break;
      }
      this._super( "_setOption", key, value );
      return value;
    }
  });

})( jQuery, window, document );