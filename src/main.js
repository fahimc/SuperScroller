(function(window) {
 function Main() {
 if(window.addEventListener) {
 window.addEventListener("load", onLoad);
 } else {
 window.attachEvent("onload", onLoad);
 }
 
 }
 function onLoad() {
	var scroller = new SuperScroller();
	scroller.init(document.getElementById("parallaxHolder"));
 }
 Main();
 }
 )(window);
