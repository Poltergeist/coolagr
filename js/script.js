var s, App= {

	settings: {
		workspace: $("body > .workspace"),
		menu: $('body > .menu'),
		proto: $('body > .protos'),
		protos: {
			img:$('.protos .image')
		},
		moreButton: $("#more-button"),
		appKey : { key: 'hCgXWB4qs1A=|4saKxla+aMBAXoHf8QNLP4G0ojwhpqgm8i+eZplBaQ==', sandbox: true },
		client:{},
		currentEvent:false,
		currentTarget:false,
		currentOffset:false,
		autoSave:false
	},

	init: function() {
		this.settings.client = new Dropbox.Client(this.settings.appKey);
		s = this.settings;
		s.client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true,useQuery:true}));
		if(this.settings.client){
		}
		this.bindUIActions();
		this.loginDropbox();
		if(s.client.isAuthenticated()){
			window.location.hash="#start"
			s.workspace.addClass('active');
		}
	},
	bindUIActions: function() {
		$('#login').click(this.loginDropbox);
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
			s.currentTarget.find('img').width('200px');
		});
		s.workspace.on('mousedown','.item img',function(e){
			s.currentEvent = 'move';
			s.currentTarget = $(e.target).parents('.item');
		});
		s.menu.on('click','.save',this.saveArt);
		s.menu.on('click','.load',this.fileList);
		$(document).mouseup(function (e) {
			s.currentEvent = false;
			s.currentTarget = false;
			s.currentOffset = false;
		});
		$(document).bind('mousemove',this.manipulate);
	},
	fileList: function(e){
		s.workspace.trigger('loadArt',"1.json");
	},
	saveArt: function(){
		var items,store;
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
		s.client.writeFile("1.json",JSON.stringify(store), function(error, stat) {
			console.log('stored');
		})

	},
	loadArt: function(e,filename){
		s.workspace.empty();
		console.log('loading');
		s.client.readFile(filename,function(error,content){
			console.log('loaded');
			var items, item, _i, _len ;
			if(error){
				return App.showError(error);
			}
			items = JSON.parse(content);
			s.styles =[]
			for (_i = 0, _len = items.length; _i < _len; _i++) {
				item = items[_i];

				//s.styles[item.path]=item.style

				(function(proxy){
					var item = proxy;
					s.client.makeUrl(item.path,{download:true},function(error,info){
						console.log('loadimages');
						info.path = item.path
						info.style = item.style
						info.imgstyle = item.imgstyle?item.imgstyle:{};
						s.workspace.trigger('loadClip',info);
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
		if (e.originalEvent.dataTransfer) {
			if (e.originalEvent.dataTransfer.files.length) {
				/*UPLOAD FILES HERE*/
				for (_i = 0, _len = e.originalEvent.dataTransfer.files.length; _i < _len; _i++) {
					file = e.originalEvent.dataTransfer.files[_i];

					s.client.writeFile(file.name,file, function(error, stat) {
						if (error) {
							return console.log(error);  // Something went wrong.
						}
						s.client.makeUrl(stat.path,{download:true},function(error,info){
							info.path = stat.path
							s.workspace.trigger('addClip',info);
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
		return s.client.authenticate(function(error, data) {
			if (error) {
				return this.showError(error);
			}else{
				window.location=window.location.origin+window.location.pathname+'#start';
			}
		});

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
	}

};


(function() {

	App.init();


})();
