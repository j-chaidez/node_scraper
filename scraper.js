// This file should be run every day ... or else

var fs = require("fs");
var xray = require('x-ray');
var x = xray();

/* 
   
   I chose x-ray because it seems like it's being actively maintained.
   It's really easy to use. There are numerous pull requests for it. Issues
   seem to be actively resolved by the developers.

*/
   
x('http://shirts4mike.com', 'a', ['@href'])(function(err, result) {
	var mainInfo;
	result.filter(function(link) {
		if (link.indexOf("id") > -1) {
			return link;
		}
	}).forEach(function(link) {
		x(link, '.section', [
		{ price: '.price', 
		  title: 'h1', 
		  src: "img@src"
		}])(function(err, result) {
			mainInfo = result;
			console.log(mainInfo);
		});
	});
});

fs.stat("./data", function(err, stats) {
	if(!stats) {
		fs.mkdir("./data", function (err) {
			if (err) {
				return console.log(err);
			}
		});
	}
});

