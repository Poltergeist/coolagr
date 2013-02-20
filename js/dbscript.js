var appKey = { key: 'hCgXWB4qs1A=|4saKxla+aMBAXoHf8QNLP4G0ojwhpqgm8i+eZplBaQ==', sandbox: true };
var client = new Dropbox.Client(appKey);
client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));
client.authenticate(function(error, data) {
	if (error) { return showError(error); }
	console.log(client);  // The user is now authenticated.
});



$('.workspace').on(
		'dragover',
		function (e) {
			e.preventDefault();
			e.stopPropagation();
		})
$('.workspace').on(
		'dragenter',
		function (e) {
			e.preventDefault();
			e.stopPropagation();
		})
$('.workspace').on(
		'drop',
		function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (e.originalEvent.dataTransfer) {
				if (e.originalEvent.dataTransfer.files.length) {
					/*UPLOAD FILES HERE*/
					console.log([0],e.originalEvent.dataTransfer,e);
					var file, _i, _len;

					for (_i = 0, _len = e.originalEvent.dataTransfer.files.length; _i < _len; _i++) {
						file = e.originalEvent.dataTransfer.files[_i];

						client.writeFile(file.name,file, function(error, stat) {
							if (error) {
								return console.log(error);  // Something went wrong.
							}
							console.log(stat);
							client.makeUrl(stat.path,{download:true},function(error,info){
								$('.workspace').append($('.protos .img').clone().attr('src',info.url));
							})
						});
					}
				} else {
					url = $(e.originalEvent.dataTransfer.getData("text/html"));
					console.log(url,e);

					if (url.filter('img').length > 0) {
						snip = {
							source: url.filter('img').attr('src'),
							type: 'img'
						};
						$('.workspace').append($('#protos .img').clone().attr('src',snip.source));
					}
				}
			}
		});

function upload(files) {
	alert('Upload ' + files.length + ' File(s).');
}

