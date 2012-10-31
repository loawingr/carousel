InfiniteCarousel = function(){
	var privatevars = [];
	var $P = privatevars;
	var that, yuii, params;
	$P.paddedclass = "empty";
	$P.cloneclass = "clone";
	$P.hitstart = false;
	$P.hitend = false;
	$P.duration = 2;
	$P.navigation = true;
	$P.buttonwidth = 20;
	$P.activeclass = "onpage";
	$P.gallerymode = false;
	$P.hoverpreview = false;
	$P.currentpage = -1;
	$P.imagegroups = [];
	$P.gesture = {startx:0, endx:0};
	$P.responsive = false;
	$P.initialised = false;
	return {
		init : function (Y, o){
			that = this;
			yuii = Y;
			params = o;
			if (params.parentid){	$P.parentid = params.parentid;	}
			else {	return;	}
			if (params.duration){ $P.duration = params.duration;	}
			if (params.navigation){	$P.navigation = true;	}
			if (params.buttonwidth){	$P.buttonwidth = params.buttonwidth;	}
			if (params.responsive){	$P.responsive = true; }

			$P.parent = yuii.one("#"+$P.parentid);
			$P.parentwidth = $P.parent.getStyle("width");
			$P.viewport = $P.parent.one(".wrapper").setStyle("overflow", "hidden");
			$P.slider = $P.parent.one("ul").setStyle("padding", 0); //padding zero for ff and safari
			that.setupAnimation();
		},
		setupAnimation : function(){
			var settings = { node: $P.slider, duration: $P.duration, easing: yuii.Easing.easeBoth};
			$P.animation = new yuii.Anim(settings);
			$P.animation.on("end", that.animationComplete);
			$P.animating = false;
			that.getItemDimensions();
		},
		destroy : function(){
			$P.animation.destroy();
			$P.parent.detachAll();
		},
		getItemDimensions : function(){
			var firstitem = $P.parent.one("ul li");
			$P.itemwidth = (parseInt(firstitem.getStyle("width"),10)+parseInt(firstitem.getStyle("paddingLeft"),10)+parseInt(firstitem.getStyle("paddingRight"),10)+parseInt(firstitem.getStyle("marginLeft"),10)+parseInt(firstitem.getStyle("marginRight"),10))+"px";
			$P.itemheight = firstitem.getStyle("height");
			that.getViewportWidth();
		},
		getViewportWidth : function(){
			$P.viewportwidth = $P.viewport.getStyle("width");
			that.getPageData();
		},
		getPageData : function(){
			if (!$P.initialised){
				$P.currentpage = 1;
				$P.realitems = $P.parent.all("ul li");
				$P.numberofitems = $P.realitems.size();
				$P.numitemstoclone = Math.ceil($P.numberofitems/2);
			}
			$P.cloneoffset = $P.numitemstoclone*parseInt($P.itemwidth, 10);
			$P.itemsperpage = Math.floor(parseInt($P.viewportwidth, 10)/parseInt($P.itemwidth, 10));
			$P.wrapwidth = parseInt($P.itemwidth, 10)*$P.itemsperpage;
			$P.gesture.minswipe = Math.floor($P.wrapwidth*0.3);
			$P.numberofpages = Math.ceil($P.numberofitems/$P.itemsperpage);
			that.setInitialView();
		},
		setInitialView : function(refresh){
			$P.fakestart = "0px";
			$P.realstart = (parseInt($P.itemwidth,10)*$P.numitemstoclone*(-1))+"px";
			//$P.fakeend = (parseInt($P.itemwidth,10)*($P.numberofitems+$P.itemsperpage)*(-1))+"px";
			$P.realend = ($P.numitemstoclone+$P.numberofitems-1)*parseInt($P.itemwidth,10)*(-1)+"px";
			$P.fakeend = (parseInt($P.itemwidth,10)*$P.numberofitems*(-1))+"px";
			//$P.realend = ($P.numitemstoclone+$P.numberofitems)*parseInt($P.itemwidth,10)*(-1)+"px";
			if (!$P.initialised){
				$P.slider.setStyle("marginLeft", $P.realstart);
				that.addPadding();
			}else{
				that.refreshNavigation();
				$P.lock = false;
			}		
		},
		addPadding : function(){
			$P.paddeditems = $P.parent.all("ul li");
			that.createClones();
		},
		createClones : function(){
			var i;
			$P.clones = [];
			$P.clones.tip = [];
			$P.paddeditems.slice($P.numitemstoclone*(-1)).each(that.cloneTip);
			$P.clones.tip.reverse();
			for (i=0; i<$P.numitemstoclone; i++){
				$P.slider.prepend($P.clones.tip[i]);
			}
			var firstitemclone = $P.paddeditems.item(0).cloneNode(true).addClass($P.cloneclass);
			$P.slider.append(firstitemclone); //yui splice bug won't allow 0 as beginning
			//if ($P.itemsperpage > 1){
				$P.clones.tail = $P.paddeditems.slice(1, $P.numitemstoclone).each(that.cloneTail);
			//}
			that.createNavigation();
		},
		cloneTip : function(node, nodeindex){
			var clone = node.cloneNode(true).addClass($P.cloneclass);
			$P.clones.tip.push(clone);
		},
		cloneTail : function(node, nodeindex){
			var clone = node.cloneNode(true).addClass($P.cloneclass);
			$P.slider.append(clone);
		},
		refreshNavigation : function(){
			//hide nodes that do not exist anymore because of resize
			$P.parent.all(".nav li").each(that.hideOrShowNavItem);
			//determine new current page
			$P.currentpage = Math.floor(Math.abs((parseInt($P.slider.getStyle("marginLeft"), 10) + $P.cloneoffset) / parseInt($P.viewportwidth, 10))+1);
			that.updateNavUI();
		},
		updateNavUI : function(){
			$P.parent.all(".nav li a").removeClass($P.activeclass).item($P.currentpage-1).addClass($P.activeclass);
		},
		hideOrShowNavItem : function(node, indice){
			if (indice+1 > $P.numberofpages){
				node.addClass("hide");
			}else{
				node.removeClass("hide");
			}
		},
		createNavigation : function(){
			var html="", activeclass="",i, preview="";
			if ($P.navigation){
				var navwidth = $P.numberofitems*$P.buttonwidth;
				html += "<div class='nav'><ul style='width:"+navwidth+"px;' class='clearfix'>";
				for (i=1; i<=$P.numberofitems; i++){
					if (i===1){ activeclass = "class='"+$P.activeclass+"' "; }
					else{ activeclass=""; }
					html +="<li><a "+activeclass+"href='#"+i+"'>"+i+"</a></li>";
				}
				html +='</ul></div>';
			}
			html +='<a href="#back" class="arrow back">&lt;</a><a href="#forward" class="arrow forward">&gt;</a>';
			$P.parent.append(html);
			$P.parent.all(".nav li").each(that.hideOrShowNavItem);
			that.listen();

		},
		scrollToPage : function(page){
			if ($P.jsonitems)
				that.fireloadevent(page);
				
			var margin = $P.numitemstoclone*parseInt($P.itemwidth,10)*(-1)+parseInt($P.itemwidth,10)*$P.itemsperpage*(page-1)*(-1);
			if (page == $P.numberofpages+1){
				margin = (-1)*($P.cloneoffset+$P.numberofitems*parseInt($P.itemwidth,10));
			}
			$P.animation.set("to",{"marginLeft": margin});
			that.animate();
		},
		animate : function(){
			if ($P.animating){ return;
			}else{
				$P.animating = true;
				$P.animation.run();
			}
		},
		animationComplete : function(){
			if ($P.hitstart){
				$P.slider.setStyle("marginLeft", $P.realstart);
				$P.hitstart = false;
				$P.currentpage = 1;
				//that.debug("changed viewport to real start");
			}else if ($P.hitend){
				$P.slider.setStyle("marginLeft", $P.realend);
				$P.hitend = false;
				$P.currentpage = $P.numberofpages;
				//that.debug("changed viewport to real end");
			}
			$P.animating = false;
			if ($P.navigation){
				that.updateNavUI();
			}
		},
		handleClick : function(e, o){
			if ($P.lock){
				return;
			}
			var el = e.target;
			var nextpage = -1;
			if (el.test("a") && el.ancestor(".nav")){
				e.preventDefault();
				if ($P.animating){ return; }
				nextpage = el.get("innerHTML");
				that.scrollToPage(nextpage);
				$P.currentpage = nextpage;
			}else if (el.test("a") && el.hasClass("arrow")){
				e.preventDefault();
				if ($P.animating){ return; }
				if (el.hasClass("forward")){
					nextpage = $P.currentpage + 1;
				}else if (el.hasClass("back")){
					nextpage = $P.currentpage - 1;
				}if (nextpage <= 0){
					$P.hitend = true;
				}else if(nextpage > $P.numberofpages){
					$P.hitstart = true;
				}
				that.scrollToPage(nextpage);
				$P.currentpage = nextpage;
			}
		},		
		listen : function(){
			yuii.on("click", that.handleClick, $P.parent, that, {});
			$P.viewport.on("gesturemovestart", that.startGesture);
			$P.viewport.on("gesturemove", that.moveGesture);
			$P.viewport.on("gesturemoveend", that.endGesture);
			$P.viewport.delegate("click", that.scrollOrClick, "a");
			if ($P.responsive){
				that.listenForResize();
			}
			$P.initialised = true;
		},
		listenForResize : function(){
			setInterval(function(){
				var spw = parseInt($P.parentwidth, 10);
				var pw = parseInt($P.parent.getStyle("width"),10);
				if (pw > ($P.itemwidth * $P.numberofitems)){
					that.debug("The container of the carousel is too large for the content");
					return;
				}
				if (!$P.lock && spw != pw){
					//lock everything
					$P.lock = true;
					//update the parent width
					$P.parentwidth = pw+"px";
				}else if (!$P.lock && spw == pw){
					
				}else{
					$P.lock = false;
					//update the dimension variables
					//unlock if in locked mode
					that.getItemDimensions(true);
				}
			}, 700);
		},
		startGesture : function (e){
			if ($P.lock){
				return;
			}
			that.preventDefault(e);
			$P.gesture.startx = e.pageX;
			$P.gesture.lastx = e.pageX;
			$P.gesture.lastscrolledamt = 0;
		},
		moveGesture : function (e){
			if ($P.lock){
				return;
			}
			that.preventDefault(e);
			var distance = $P.gesture.startx - e.pageX;
			var absdistance = Math.abs(distance);
			if(that.hitEnd(distance)){
				return;
			}
			if($P.wrapwidth <= absdistance){
				return;
			}
			var ml = parseInt($P.slider.getStyle("marginLeft"), 10);
			if ($P.gesture.lastx < e.pageX){
				$P.slider.setStyle("marginLeft", ml + (Math.abs($P.gesture.lastx-e.pageX)));
			}else{
				$P.slider.setStyle("marginLeft", ml - (Math.abs($P.gesture.lastx-e.pageX)));
			}
			$P.gesture.lastx = e.pageX;
			
			
		},
		endGesture : function(e){
			if ($P.lock){
				return;
			}
			that.preventDefault(e);
			$P.gesture.endx = e.pageX;
			var distance = $P.gesture.startx - $P.gesture.endx;
			if (that.hitEnd(distance)){ return; }
			//that.debug("distance travelled "+distance);
			var absdistance = Math.abs(distance);
			var direction = ($P.gesture.startx > $P.gesture.endx)?"right":"left";
			var hitthreshold = (absdistance >= $P.gesture.minswipe)?true:false;
			var nextpage = null;
			if (hitthreshold){ //swipe less than a page
				switch(direction){
					case "left":
						nextpage = $P.currentpage - 1;
						if (nextpage <= 0){ $P.hitend = true; }
						that.scrollToPage(nextpage);
						$P.currentpage = nextpage;
					break;
					case "right":
						nextpage = $P.currentpage + 1;
						if(nextpage > $P.numberofpages){ $P.hitstart = true; }
						that.scrollToPage(nextpage);
						$P.currentpage = nextpage;
					break;
				}
			}else{ //bounce back
				that.scrollToPage($P.currentpage);
			}
			$P.gesture.lastscrolledamt = absdistance;
			
		},
		hitEnd : function (distance){
			if(($P.currentpage === 1 && distance < (-1*$P.itemwidth)) ||($P.currentpage === $P.numberofpages && distance > $P.itemwidth)){
				return true;
			}
			return false;
		},
		scrollOrClick : function(e){
			if ($P.gesture.lastscrolledamt > 2){
				that.preventDefault(e);
			}
		},
		preventDefault : function(e){
			if (e && e.preventDefault){
				e.preventDefault();
			}
		},
		debug: function(str) {
			if (typeof console !== 'undefined'){ console.log(str); }
		}
	};
};