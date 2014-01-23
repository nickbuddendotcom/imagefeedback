/*!
 * Image Annotation/Feedback Plugin
 * Author: nickbudden.com
 * Licensed under the MIT license
 */
;(function ( $, window, document, undefined ) {

  $.widget( "nb.imageFeedback" , {

  	/*
			- there's an issue with numbers not resetting right when you click to delete
			- extract some of the create marker stuff into its own classes
			- give it four corners
			- guess the drag direction (and drag handle) you want based on which direction you drag in
			- I should probably rename 'Offset since it's actually abs positioning'
			- comment bubbles themselves need to z-index themselves to the top
			- resizing sometimes stops, when creating on drag. Probably something to do with triggering events.
			- move the number and X onto the side, fadeout without hover to 40%ish, fade in on hover
			- comment and refactor

			Make an option for the serialized array to create with, test it with a loop of addMarker

  	*/

    //Options to be used as defaults
    options: {
    	markers      : false,
      commentNum   : 0,
      isDragging   : false,
      wasDragging  : false,
      isResizing   : false
    },

    _create: function () {
    	var _this   = this,
    			$el     = _this.element,
    			$w      = $(window),
    			$editingMarker,
    			mousedownX,
    			mousedownY,
    			mouseChangeX,
    			mouseChangeY;

    	// Wrap the image, so we can position our markers
			$el.wrapAll("<div class='jquery-annotate-wrap' />").parent();

			// If we have passed markers, load them
			if(this.options.markers) {
				$.each(this.options.markers, function(i, element) {
					_this.addMarker(null, element.width, element.height, element.value, element.offsetTop, element.offsetLeft);
				});
			}

			// Don't allow dragging of the image itself
    	$el.on('dragstart', function(e) {
    		e.preventDefault();
    	})
    	// Differentiate between a click and a drag,
    	// firing a different event for each
			// http://stackoverflow.com/a/4139860/740836
			.mousedown(function(e) {
				mousedownX = e.offsetX;
				mousedownY = e.offsetY;

				// This is a drag
		    $w.mousemove(function(e) {
	        _this._setOption('isDragging', true);
	        mouseChangeX = Math.abs( Math.abs(mousedownX) - Math.abs(e.offsetX) );
	        mouseChangeY = Math.abs( Math.abs(mousedownY) - Math.abs(e.offsetY) );

	        // Make them drag at least 8px before we create our box
	        if(mouseChangeX >= 50 || mouseChangeY >= 50) {
	        	var $marker, handle;

	        	$w.unbind("mousemove");

	        	$marker = _this.addMarker(e, mouseChangeX, mouseChangeY);
	        	// If changeX negative then sw otherwise se

    				// If we're creating a box while dragging, we'll
    				// want to manually trigger jQuery UI's draggable
    				// handle
    				// http://stackoverflow.com/a/19768036/740836
    				// TODO: check whether it's se or sw
    				// If this works, figure out which handle next
					  $marker.find(".ui-resizable-se")
					    .trigger("mouseover")
					    .trigger({
					      type: "mousedown",
					      which: 1,
					      pageX: e.pageX,
					      pageY: e.pageY
					  });
	        }
		    });

			}).mouseup(function(e) {
				_this._setOption('wasDragging', _this.options.isDragging);
				_this._setOption('isDragging', false);
				_this._setOption('wasDragging', false);

		    $w.unbind("mousemove");

		    // This was a click, not a drag
		    if (!_this.options.wasDragging) {
		    	$editingMarker = $(".jquery-annotate-comment-edit");

		    	// If something's open to edit, hide it on click
		    	if($editingMarker.length > 0) {
		    		_this.stopEditingMarker( $editingMarker );

		    	// If nothing's open, create a new marker on click
		    	} else {
			    	_this.editMarker( _this.addMarker(e) );
		    	}
		    }

			});

    },

    addMarker: function(e, width, height, value, offsetTop, offsetLeft) {
    	var _this       = this,
    			value       = (typeof value !== 'undefined') ? $.trim(value) : false,
    			offsetTop   = (typeof offsetTop !== 'undefined') ? offsetTop : e.offsetY,
    			offsetLeft  = (typeof offsetLeft !== 'undefined') ? offsetLeft : e.offsetX,
    			commentNum  = 0,
    			$marker;

			commentNum = _this._setOption( 'commentNum', _this.options.commentNum + 1 );
			$marker = $(_this.markerHTML(commentNum));

			// If width hasn't been set, set to 50 and
			// center box on cursor by moving offset half
			// the width Note that width/height aren't set
			// on drag, so we start that event here
			if(typeof width === "undefined") {
				width = 50;
				offsetLeft = offsetLeft - 25;
			}

			// Same as above
			if(typeof height === "undefined") {
				height = 50;
				offsetTop = offsetTop - 25;
			}

			if(value) {
				$marker.find('textarea').val(value);
				$marker.find('p').text(value);
			}

			$marker.css({
    		left: offsetLeft,
    		top: offsetTop,
    		width: width,
    		height: height
    	})
    	.appendTo(_this.element.parent())
    	.draggable({
    		// TODO: add a handle so you can't drag by the comment itself
    		// It needs to be something absolutely positioned inside the comment...because
    		// the comment bubble is inside of the current div
    		// handle: '.jquery-annotate-comment',
				containment: 'parent',
				opacity: 0.5,
				start: function( e, ui ) {
					_this._setOption('isDragging', true);
					_this.hideComment( this );
				},
				stop: function( e, ui ) {
					_this._setOption('isDragging', false);
					_this.editMarker( this );
				}
			})
			.resizable({
				minHeight: 50,
				minWidth: 50,
				handles: 'se, sw',
				// TODO: get rid of the $marker reference, and put the parent into an option
				containment: $marker.parent(),
				start: function( e, ui ) {
					_this._setOption('isResizing', true);
					_this.hideComment( this );
				},
				stop: function( e, ui ) {
					_this._setOption('isResizing', false);

					// TODO: cache $bubble
					// This replaces the bubble's
					// Refactor this section...
					var $bubble = $(this).find('.jquery-annotate-bubble');
					$bubble.css('top', $(this).height() + 5);

					_this.editMarker( this );
				}
	    })
	    .on('click', function(e) {
	    	// TODO: this section isn't working....
				_this.editMarker( this );
	    })
	    .on('mouseup', function(e) {
	    	var $this = $(this);
	    	// TODO: This selection doesn't support multiple instances on one page...
	    	$(".jquery-annotate-comment-wrap").not($this).css('z-index', 0);
	    	$this.css('z-index', 1000);
	    });

			// Handle clicking the "X"
			$marker.find('.jquery-annotate-delete').on('click', function(e) {
				e.preventDefault();
				_this.deleteMarker( $(this).closest('.jquery-annotate-comment-wrap') );
			});

			// Submit on enter
			$marker.find('textarea').keypress(function(e) {
		    if(e.which == 13) {
		    	// TODO: cache $marker.find('form')
	        $marker.find("form").submit();
		    }
			});

			$marker.find("form").submit(function(e) {
				e.preventDefault();

				// Serialize the comments
	    	var	serialized = {},
	    			thisCommentID = $(this).closest('.jquery-annotate-comment-wrap').data('annotation-id'),
	    			comment,
	    			$el,
	    			id;

  			// TODO: _this context so I can have multipl .jquery-annotate-comment-wrap instances per page
	    	$(".jquery-annotate-comment-wrap").each(function(e, element) {
	    		$el = $(element);
	    		id  = $el.data('annotation-id');

	    		serialized[id] = {
	    			value       : $el.find('textarea').val(),
	    			width       : $el.width(),
	    			height      : $el.height(),
	    			offsetTop   : $el.css('top'),
	    			offsetLeft  : $el.css('left')
	    		}
	    	});

	    	comment = serialized[thisCommentID];
	    	serialized = JSON.stringify(serialized);

				// Trigger with the event, the text of this edited comment, and a serialized object of all comments
				_this._trigger('commentSaved', event, [comment, serialized]);

				$marker.find('p').html(comment.value);

				_this.stopEditingMarker( $marker );

			});

			return $marker;
    },

    deleteMarker: function($marker) {
    	var _this    = this,
    			markerID = parseInt($marker.data('annotation-id'), 10);

			// So before I call deleteMarker, I need to check if some other marker is open...
			// Where is this called? If that's not the issue, check for an open one and see if
			// it's the same instance as the one I'm currently deleting...

    	// If this was not the most recently added one, we need to decrement
    	// every higher number'd marker's number by 1
    	// if(markerID !== _this.options.commentNum) {
    		while(markerID <= _this.options.commentNum) {
    			$('*[data-annotation-id="' + (markerID + 1) + '"')
    				.data('annotation-id', markerID)
    				.find(".jquery-annotate-number").html(markerID);

    			markerID++;
    		}
    	// }

    	this._setOption('commentNum', (this.options.commentNum - 1) );
    	$marker.remove();
    },

    // Show the comment bubble...
    showComment: function($marker) {
    	$marker = this.makeJqueryObj($marker);
    	$marker.removeClass('jquery-annotate-comment-modifying');
    },

    // Hide the comment bubble...
    hideComment: function($marker) {
    	$marker = this.makeJqueryObj($marker);
    	$marker.addClass('jquery-annotate-comment-modifying');
    },

    // Set the active marker
    editMarker: function($marker) {
    	var _this = this,
  	    	$marker = _this.makeJqueryObj($marker);

    	$(".jquery-annotate-comment-wrap").not($marker).each(function(i, element) {
				_this.stopEditingMarker(element);
    	});

    	// TODO: I should be able to drop my review class completely. That's just done with hover now.

    	$marker.removeClass('jquery-annotate-comment-modifying')
    		.addClass('jquery-annotate-comment-edit')
    		.find('textarea').focus();
    },

    // TODO: rename this shit
    stopEditingMarker: function($element) {

    	$element = this.makeJqueryObj($element);

    	if($element.find('textarea').val() == '') {
    		this.deleteMarker($element);
    	}

    	// TODO: check if empty, if it is, delete it
    	$element.removeClass("jquery-annotate-comment-review jquery-annotate-comment-edit jquery-annotate-comment-modifying");
    },

    // TODO: work this into other places so I can stop doing it per instance...
    makeJqueryObj: function(obj) {
    	return (obj instanceof jQuery) ? obj : $(obj);
    },

    markerHTML: function(num) {
    	return [
    		"<div data-annotation-id='", num, "' class='jquery-annotate-comment-wrap'>",
	    		"<div class='jquery-annotate-comment'>",
	    			"<div class='jquery-annotate-bubble'>",
		    			"<p></p>",
		    			"<form action='' method='post'>",
		    				"<textarea></textarea>",
		    				"<input type='submit' value='OK' />",
		    			"</form>",
	    			"</div>",
    				"<div class='jquery-annotate-number'>", num, "</div>",
    				"<a class='jquery-annotate-delete' href='#!'>X</a>",
    			"</div>",
	    	"</div>"
    	].join("");
    },

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