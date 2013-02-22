var s, App= {

	settings: {
		load: $("body > .loading"),
		actionText: $('.actions'),
		workspace: $("body > .workspace"),
		menu: $('body > .menu'),
		splash: $('body > .splash'),
		start: $('body > .start'),
		proto: $('body > .protos'),
		boardList: $('.artboards'),
		protos: {
			img:$('.protos .image')
		},
		moreButton: $("#more-button"),
		appKey : { key: 'hCgXWB4qs1A=|4saKxla+aMBAXoHf8QNLP4G0ojwhpqgm8i+eZplBaQ==', sandbox: true },
		client:{},
		currentEvent:false,
		currentTarget:false,
		currentOffset:false,
		userSettings:{},
		autoSave:false,
		currentArtboard:null,
		actions:0

	},

	init: function() {
		this.settings.client = new Dropbox.Client(this.settings.appKey);
		s = this.settings;
		s.client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true,useQuery:true}));
		this.bindUIActions();
		this.relocate();
		if(s.client.isAuthenticated()){
			window.location.hash="#start"
			s.workspace.addClass('active');
		}else{
			//this.loginDropbox();
			window.location.hash="#welcome"
		}
		//console.log ( s.client.isAuthenticated() )
	},
	bindUIActions: function() {
		$('#login,.login').click(this.loginDropbox);
		s.workspace.on('dragover dragenter',this.stopEvents);
		s.workspace.on('drop',this.uploadFiles);
		s.workspace.on('addClip',this.addClip);
		s.workspace.on('loadClip',this.loadClip);
		s.workspace.on('loadArt',this.loadArt);
		s.workspace.on('mousedown','.rotate',function(e){
			s.currentEvent = 'rotate';
			s.currentTarget = $(e.target).parents('.item');
		});
		s.workspace.on('mousedown','.scale',function(e){
			s.currentEvent = 'scale';
			s.currentTarget = $(e.target).parents('.item');
		});
		s.workspace.on('mousedown','.lvlUp',function(e){
			s.currentTarget = $(e.target).parents('.item');
			s.currentTarget.insertAfter(s.currentTarget.next());
		});
		s.workspace.on('mousedown','.lvlDwn',function(e){
			s.currentTarget = $(e.target).parents('.item');
			s.currentTarget.insertBefore(s.currentTarget.prev());
		});
		s.workspace.on('mousedown','.item img',function(e){
			s.currentEvent = 'move';
			s.currentTarget = $(e.target).parents('.item');
		});
		s.boardList.on('click','li',this.setCurrentBoard)
		s.menu.on('click','.save',this.saveArt);
		$(document).mouseup(function (e) {
			s.currentEvent = false;
			s.currentTarget = false;
			s.currentOffset = false;
		});
		$(document).bind('mousemove',this.manipulate);
		$(window).on('hashchange', this.relocate);
		$('.createArt').on('click',this.createNewBoard);
	},
	createNewBoard: function(e){
		s.currentArtboard = $('#artboard').val()+'.json';
		$('#artboard').val('');
		s.client.writeFile("boards/"+s.currentArtboard,JSON.stringify([]), function(error, stat) {
			if(error){
				App.showError({e:error,loc:'create'})
			}
			window.location.hash='board'
		});
	},
	setCurrentBoard: function(e){
		var tar = $(e.target);
		s.currentArtboard = tar.attr('data-board');
		window.location.hash='board'
	},
	relocate: function(){
		var hash = window.location.hash;
		$('body > div.active').removeClass('active');
		switch(hash){
			case '#welcome':
				s.splash.addClass('active');
				break;
			case '#start':
				s.start.addClass('active');
				App.fileList();
				break;
			case '#board':
				s.workspace.addClass('active');
				s.menu.addClass('active');
				App.loadArt('',s.currentArtboard);
				break;
			default:
				break;
		}
	},
	fileList: function(e){
		$('.artboards').empty();
		s.client.readdir("/boards",function(error,list){
			var file, _i, _len , re ;
			re = /.json$/;
			if(error){
				if(error.status==404){
					s.client.mkdir('boards')
				}
			}else{
				for (_i = 0, _len = list.length; _i < _len; _i++) {
					file = list[_i];
					$('.artboards').append($('<li></li>').text(file.replace(re,"")).attr('data-board',file))
				}
			}
		})
	},
	saveArt: function(e){
		var items,store;
		e.preventDefault();
		items=s.workspace.find('.item');
		store = [];
		items.each(function(){
			var $this = $(this);
			store.push({
				style: {
					'left':$this.css('left'),
					'top':$this.css('top'),
					'transform':$this.css('transform'),
				},
				imgstyle:{
					'width':$this.css('width')
				},
				path: $this.find('img').attr('data-path')
			})
		});
		s.client.writeFile("boards/"+s.currentArtboard,JSON.stringify(store), function(error, stat) {
			console.log('stored');
			window.location.hash = 'board'
		})

	},
	loadArt: function(e,filename){
		s.workspace.empty();
		console.log('filename',filename)
		s.client.readFile("boards/"+filename,function(error,content){
			var items, item, _i, _len ;
			if(error){
				return App.showError({e:error,'loc':'load'});
			}
			items = JSON.parse(content);
			s.styles =[]
			if(items.length!=0){
				s.load.addClass('active');
			}
			for (_i = 0, _len = items.length; _i < _len; _i++) {
				item = items[_i];
				s.actions++;
				s.actionText.text(s.actions + ' to go');

				//s.styles[item.path]=item.style

				(function(proxy){
					var item = proxy;
					s.client.makeUrl(item.path,{download:true},function(error,info){
						console.log('loadimages');
						info.path = item.path
						info.style = item.style
						info.imgstyle = item.imgstyle?item.imgstyle:{};
						s.workspace.trigger('loadClip',info);
						s.actions--;
						s.actionText.text(s.actions + ' to go');
						if(s.actions==0){
							s.load.removeClass('active');
						}
					});
				})(item)

			}


		});
	},
	stopEvents: function(e){
		e.preventDefault();
		e.stopPropagation();
	},
	addClip: function(e,info){
		var item;
		item = s.protos.img.clone();
		item.find('img').attr('src',info.url).attr('data-path',info.path);
		item.css('transform','rotate('+parseInt((Math.random()*90)-45)+'deg)');
		s.workspace.append(item);
	},
	loadClip: function(e,info){
		var item;
		item = s.protos.img.clone();
		item.find('img').attr('src',info.url).attr('data-path',info.path);
		item.css(info.style);
		item.find('img').css(info.imgstyle);
		s.workspace.append(item);
	},
	uploadFiles: function(e){
		var file, _i, _len ;
		e.preventDefault();
		e.stopPropagation();
		s.load.addClass('active');
		if (e.originalEvent.dataTransfer) {
			if (e.originalEvent.dataTransfer.files.length) {
				/*UPLOAD FILES HERE*/
				for (_i = 0, _len = e.originalEvent.dataTransfer.files.length; _i < _len; _i++) {
					file = e.originalEvent.dataTransfer.files[_i];
					s.actions++;
					s.actionText.text(s.actions + ' to go');

					s.client.writeFile(s.currentArtboard + '/' + file.name,file, function(error, stat) {
						if (error) {
							return console.log(error);  // Something went wrong.
						}
						s.client.makeUrl(stat.path,{download:true},function(error,info){
							info.path = stat.path
							s.workspace.trigger('addClip',info);
							s.actions--
							s.actionText.text(s.actions + ' to go');
							if(s.actions==0){
								s.load.removeClass('active');
							}
						});
					});
				}
			} else {
				url = $(e.originalEvent.dataTransfer.getData("text/html"));

				if (url.filter('img').length > 0) {
					info = {
						url: url.filter('img').attr('src'),
						type: 'img'
					};
					s.workspace.trigger('addClip',info);
				}
			}
		}
	},
	loginDropbox: function(){
		if(!s.client.isAuthenticated()){
		return s.client.authenticate(function(error, data) {
			if (error) {
				return App.showError(error);
			}else{
				window.location=window.location.origin+window.location.pathname+'#start';
			}
		});
		}else{
				window.location=window.location.origin+window.location.pathname+'#start';

		}

	},

	getMoreArticles: function(numToGet) {
		// $.ajax or something
		// using numToGet as param
	},
	showError: function(){
		console.log(this.settings.client)
	},
	manipulate: function(e) {
		if(s.currentEvent==='rotate'){
			var img = s.currentTarget;
			var offset = img.offset();
			var center_x = (offset.left) + (img.width() / 2);
			var center_y = (offset.top) + (img.height() / 2);
			var mouse_x = e.pageX;
			var mouse_y = e.pageY;
			var radians = Math.atan2(mouse_x - center_x, mouse_y - center_y);
			var degree = (radians * (180 / Math.PI) * -1);
			img.css('transform', 'rotate(' + degree + 'deg)');
		}
		if(s.currentEvent==='move'){
			var img = s.currentTarget;
			if(!s.currentOffset){
				s.currentOffset={
					left:e.pageX - img.offset().left,
					top:e.pageY - img.offset().top
				}
			}
			var leftPos = e.pageX - s.currentOffset.left ;
			var topPos = e.pageY - s.currentOffset.top;
			var maxWidth = s.workspace.innerWidth() - img.outerWidth() - 10;
			var maxHeight= s.workspace.innerHeight() - img.outerHeight() - 10;
			img.css({'left':( leftPos >= 0 && leftPos < maxWidth ?leftPos:leftPos > maxWidth? maxWidth:0 ) ,'top':( topPos >= 0 && topPos <= maxHeight?topPos:topPos>maxHeight?maxHeight:0 ) });
		}
		if(s.currentEvent==='scale'){
			var img = s.currentTarget.find('img');
			var width = e.pageX - parseInt(s.currentTarget.css('border-left-width')) - img.offset().left;


			/*var leftPos = e.pageX - s.currentOffset.left ;
			var topPos = e.pageY - s.currentOffset.top;
			var maxWidth = s.workspace.innerWidth() - img.outerWidth() - 10;
			var maxHeight= s.workspace.innerHeight() - img.outerHeight() - 10;*/
			img.css('width',width);
		}
	}

};


(function() {

	App.init();


})();
