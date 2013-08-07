var SuperScroller = function() {
};
(function() {
	var _ = SuperScroller.prototype;

	_.handlers = [];
	_.previousScrollPosition = 0;
	_.scrollPosition = 0;
	_.scrollbar = null;
	_.scrollhandle = null;
	_.holder = null;
	_.container = null;
	_.speed = 1;
	_.duration = 0;
	_.holderHeight = 0;
	_.currentIndex = 0;
	_.atts = {
		sticky : "data-sticky-frames",
		top : "data-top"
	}
	_.isSticky = false;
	_.releaseStickyPosition = 0;
	_.children = [];
	_.holderTop = 0;
	_.totalHeight = 0;
	_.scrollDirection = 0;
	// _.startTime = 0;
	// _.frameRate = 0.016;
	_.init = function(holder) {
		this.holder = holder;
		this.container = document.createElement("div");
		this.setContainer();
		this.setHolder();
		this.setDuration(this.speed);
		this.createScroller();
		this.getChildren();
	}
	_.setHolder = function() {
		this.holder.parentNode.removeChild(this.holder);
		this.holder.style.position = "absolute";
		this.container.appendChild(this.holder);
	}
	_.setContainer = function() {
		this.container.style.position = "relative";
		this.container.style.width = "100%";
		this.container.style.overflow = "hidden";
		this.container.style.height = "100%";

		this.holder.parentNode.appendChild(this.container);
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
		this.startTime = new Date().getTime();
	}
	_.scrollerMouseUp = function() {

		Utensil.removeListener(document, "mouseup", this.getHandler("scrollerMouseUp"));
		Utensil.removeListener(document, "mousemove", this.getHandler("scrollerMouseMove"));
	}
	_.mouseLeave = function(event) {
		if (event.toElement == null && event.relatedTarget == null)
			this.getHandler("scrollerMouseUp")(event);
	}
	_.mouseWheel = function(event) {
		var delta = event.detail ? event.detail * (-120) : event.wheelDelta//check for detail first so Opera uses that instead of wheelDelta
		this.previousScrollPosition = this.scrollPosition;
		this.scrollPosition -= delta > 0 ? 10 : -10;
		this.checkScrollPosition();
		this.moveHandle();
		this.moveHolder();

		this.setCurrentIndex();
		this.getHolderHeight();
		this.checkSticky();
	}
	_.scrollerMouseMove = function(event) {
		this.previousScrollPosition = this.scrollPosition;
		this.scrollPosition = Utensil.mouseY(document.body, event);
		this.checkScrollPosition();
		this.moveHandle();

		this.moveHolder();
		this.setCurrentIndex();
		this.getHolderHeight();
		this.checkSticky();

	}
	_.setDuration = function(speed) {
		//formula time = distance / speed
		this.duration = this.holder.clientHeight / speed;

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
		var diff = (Math.abs(this.previousScrollPosition - this.scrollPosition) / Utensil.stageHeight()) * this.holder.clientHeight;
		var hTop = this.getScrollPercentage() * this.totalHeight;
		console.log(hTop);
		if (this.previousScrollPosition > this.scrollPosition)
			diff = -diff;
		//var scrollPercentage = this.currentScrollPosition() / Utensil.stageHeight();
		//this.holder.style.top = -(scrollPercentage * (this.getHolderHeight() - Utensil.stageHeight())) + "px";
		this.holderTop = hTop;
		if (this.sticky)
			return;
		this.holder.style.top = -(this.getHolderTop() + diff) + "px";
	}
	_.checkSticky = function() {
		var currentItem = this.children[this.currentIndex];
		console.log(currentItem.getAttribute(this.atts.sticky));
		if (currentItem.getAttribute(this.atts.sticky)) {
			var framerate = Number(currentItem.getAttribute(this.atts.sticky));
			this.releaseStickyPosition = Number(currentItem.getAttribute(this.atts.top)) + (framerate * currentItem.clientHeight);
			this.sticky = true;
			console.log("STICK IS TRUE");
		} else {
			this.sticky = false;
			console.log("STICK IS FALSE")
		}

		var holderCurrentTop = this.getHolderTop();
		
		if (this.holderTop >= this.releaseStickyPosition) {
			this.sticky = false;
		}
		// if(this.releaseStickyPosition)
	}
	_.currentScrollPosition = function() {
		var top = Number(this.scrollhandle.style.top.replace("px", ""));

		return top + this.scrollhandle.clientHeight;
	}
	_.getScrollPercentage = function() {
		var top = Number(this.scrollhandle.style.top.replace("px", "")) + this.scrollhandle.clientHeight;
		var scrollPercentage = top / Utensil.stageHeight();
		return scrollPercentage;
	}
	_.setCurrentIndex = function() {

		for (var a = 0; a < this.children.length; a++) {
			var element = this.children[a];

			var currentTop = this.getOffset(element).top;
			var currentParentTop = this.getOffset(this.holder).top;
			if (currentTop <= 0 && this.currentIndex != a) {
				this.currentIndex = a;
				console.log("CHANGED_INDEX", a);
			}

		}
	}
	_.getChildren = function() {
		var previousTop = 0;
		for (var a = 0; a < this.holder.childNodes.length; a++) {
			var element = this.holder.childNodes[a];
			if (element.tagName == "DIV") {
				var stickFrames = Number(element.getAttribute(this.atts.sticky));
				element.setAttribute(this.atts.top, previousTop);
				element.style.height=Utensil.stageHeight()+"px";
				this.children.push(element);

				previousTop += element.clientHeight + ( stickFrames ? (stickFrames * element.clientHeight) : 0);
			}
		}
	}
	_.getHolderTop = function() {
		var top = Math.abs(this.holder.style.top.replace("px", ""));
		if (!top)
			top = 0;
		return top;
	}
	_.getHolderHeight = function() {
		var h = this.holder.clientHeight;
		//loop children and find sticky
		for (var a = 0; a < this.holder.childNodes.length; a++) {
			var element = this.holder.childNodes[a];

			if (element.getAttribute && element.getAttribute(this.atts.sticky)) {
				var stickFrames = Number(element.getAttribute(this.atts.sticky));
				h = h + (stickFrames * element.clientHeight);
			}
		}
		this.totalHeight = h;
		return h;

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
