var SuperScroller = function() {
};
(function() {
	var _ = SuperScroller.prototype;

	_.handlers = [];
	_.scrollPosition = 0;
	_.scrollbar = null;
	_.scrollhandle = null;
	_.holder = null;
	_.speed = 1;
	_.duration = 0;
	_.init = function(holder) {
		this.holder = holder;
		this.setDuration(this.speed);
		this.createScroller();
	}
	_.createScroller = function() {
		document.body.style.overflow = "hidden";

		this.scrollbar = document.createElement("div");
		this.scrollbar.style.position = "absolute";
		this.scrollbar.style.top = "0";
		this.scrollbar.style.right = "0";
		this.scrollbar.style.width = this.scrollbarWidth + "px";
		this.scrollbar.style.height = Utensil.stageHeight();
		this.scrollbar.style.zIndex = "998";
		this.scrollbar.style.cursor = "pointer";
		this.scrollbar.className = "scroller";
		document.body.appendChild(this.scrollbar);

		this.scrollhandle = document.createElement("div");
		this.scrollhandle.style.position = "absolute";
		this.scrollhandle.style.top = "0";
		this.scrollhandle.style.width = this.scrollbarWidth + "px";
		this.scrollhandle.style.height = this.scrollhandleHeight + "px";
		this.scrollhandle.style.zIndex = "999";
		this.scrollhandle.style.cursor = "pointer";
		this.scrollhandle.className = "scrollerhandle";

		this.scrollbar.appendChild(this.scrollhandle);

		var root = this;
		Utensil.addListener(this.scrollbar, "mousedown", function(event) {
			root.scrollerMouseDown(event);
		});
		Utensil.addListener(document, "mouseout", function(event) {
			root.mouseLeave(event);
		});

		//mousewheel
		var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"//FF doesn't recognize mousewheel as of FF3.x

		if (document.attachEvent)//if IE (and Opera depending on user setting)
			document.attachEvent("on" + mousewheelevt, function(event) {
				root.mouseWheel(event);
			});
		else if (document.addEventListener)//WC3 browsers
			document.addEventListener(mousewheelevt, function(event) {
				root.mouseWheel(event);
			}, false);

	}
	_.scrollerMouseDown = function(event) {
		var root = this;
		Utensil.addListener(document, "mouseup", this.getHandler("scrollerMouseUp"));
		Utensil.addListener(document, "mousemove", this.getHandler("scrollerMouseMove"));
	}, _.scrollerMouseUp = function() {

		Utensil.removeListener(document, "mouseup", this.getHandler("scrollerMouseUp"));
		Utensil.removeListener(document, "mousemove", this.getHandler("scrollerMouseMove"));
	}, _.mouseLeave = function(event) {
		if (event.toElement == null && event.relatedTarget == null)
			this.getHandler("scrollerMouseUp")(event);
	}, _.mouseWheel = function(event) {
		var delta = event.detail ? event.detail * (-120) : event.wheelDelta//check for detail first so Opera uses that instead of wheelDelta
		var previousScrollPosition = this.scrollPosition;
		this.scrollPosition -= delta > 0 ? 10 : -10;
		this.checkScrollPosition();
		this.moveHandle();
		this.moveHolder();
		this.setCurrentIndex();

	}, _.scrollerMouseMove = function(event) {
		var previousScrollPosition = this.scrollPosition;
		this.scrollPosition = Utensil.mouseY(document.body, event);
		this.checkScrollPosition();
		this.moveHandle();

		this.moveHolder();
		this.setCurrentIndex();
	}
	_.setDuration = function(speed) {
		//formula time = distance / speed
		this.duration = this.holder.clientHeight / speed;
		console.log(this.duration);

	}
	_.checkScrollPosition = function() {
		if (this.scrollPosition < 0)
			this.scrollPosition = 0;
		var scrollMaxHeight = Utensil.stageHeight() - this.scrollhandle.clientHeight;
		if (this.scrollPosition >= scrollMaxHeight)
			this.scrollPosition = scrollMaxHeight;
	}
	_.moveHandle = function() {
		this.scrollhandle.style.top = ((this.scrollPosition >= Utensil.stageHeight() - this.scrollhandleHeight) ? Utensil.stageHeight() - this.scrollhandleHeight : this.scrollPosition) + "px";
	}
	_.moveHolder = function() {
		//calculate percentage of scroller
		var scrollPercentage = this.currentScrollPosition() / Utensil.stageHeight();
		this.holder.style.top = -(scrollPercentage * this.holder.clientHeight) + "px";
	}
	_.currentScrollPosition = function() {
		var top = Number(this.scrollhandle.style.top.replace("px", ""));

		return top + this.scrollhandle.clientHeight;
	}
	_.setCurrentIndex = function() {

		for (var a = 0; a < this.holder.childNodes.length; a++) {
			var element = this.holder.childNodes[a];
			
			if (element.tagName == "DIV") {
				var currentTop = this.getOffset(element).top;
				var currentParentTop = this.getOffset(this.holder).top;
				if (currentTop <= 0) {
					//element.className+=" "+this.classNames.STICKY;
					//this.stickyItems[a].defaultTop=currentParentTop;
					//this.setSticky(element);
					//this.executeCallbacks(this.events.ON_STICKY);
					console.log("new index",a);
				} 
			}
		}
	}
	_.getOffset = function(el) {
		var _x = 0;
		var _y = 0;
		while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
			_x += el.offsetLeft - el.scrollLeft;
			_y += el.offsetTop - el.scrollTop;
			el = el.offsetParent;
		}
		return {
			top : _y,
			left : _x
		};
	}
	_.getHandler = function(eventName) {
		if (this.handlers[eventName])
			return this.handlers[eventName];
		var root = this;
		this.handlers[eventName] = function(event) {
			root[eventName](event);
		}
		return this.handlers[eventName];
	}
})();
