// This file should be run every day ... or else
	
/* 
   
   I chose x-ray because it seems like it's being actively maintained.
   It's really easy to use. There are numerous pull requests for it. Issues
   seem to be actively resolved by the developers.

*/

/* 

	I chose json2csv because it is insanely easy to use. It looks as though the creator 
	is actively contributing to it. There are nearly 31 contributors, and there are a 
	total of 33 releases
	
*/

/** 
 * This is a self executing function designed to encapsulate all variables, functions, and program logic
 * within a single variable to help prevent polluting the global namespace
*/

var app = (function() {
	
	/**
	  * Declare all variables used for the program
	*/
	
	var fs = require("fs");
	var xray = require('x-ray');
	var x = xray();
	var json2csv = require('json2csv');
	var fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
	
	return {
		
		 /**
			* Initializes the program
		 */
		 
		init: function() {
			this.createDataFolder();
			this.getLinks.then(this.parseLinks)
			.then(this.scrapeLinks)
			.then(this.renderToCsv);
			
		},
		
		/**
		   * Checkes to see if the data folder exists. If not, it creates it.
		*/
		
		createDataFolder: function() {
			fs.stat('./data', function(err, stats) {
				if (!stats) { 
					fs.mkdir("./data", function (err) {
						if (err) {
							app.writeToErrorLog(err);
						}
					});
				}
				if (err) {
					app.writeToErrorLog(err);
				}
			});				
		},
		
		/** 
		  * Gets all of the links on the main page of the shirts4mike website
		*/
		
		getLinks: new Promise(function(resolve, reject) {
			x('http://shirts4mike.com', 'a', ['@href'])(function(err, result) {
				if (err) {
					reject(result);
					app.writeToErrorLog(err);
				} else {
					resolve(result);
				}
			});
		}),
		
		/**
		   * Parses the links from getLinks and finds the ones that have 'shirt' and 'id'
		*/
		
		parseLinks: function(result) {
			return new Promise(function(resolve, reject) {
				var href = [];
				result.forEach(function(link) {
					x(link, 'a', ['@href'])(function(err, result) {
						if (err) {
							reject(result);
							app.writeToErrorLog(err);
						} else {
							if (result) {
								result.filter(function(link) {
									if (link) {
										if (link.indexOf('id') > -1 && link.indexOf('shirt') > -1) {
											href.push(link);
										} else if (link.indexOf('privacy-full') > -1) {
											var set = new Set(href);
											resolve(set);
										}
									}
								});
							}
						}
					});
				});
			});
		},
		
		/**
		   *Scrapes the links from parseLinks and actually get the information
		   *needed for the CSV
		*/
		
		scrapeLinks: function(result) {
			return new Promise(function(resolve, reject) {
				var finalInfo = [];
				var itemCount = 0;
				result.forEach(function(item) {
					itemCount++;
					x(item, '.section', [
					{
						Title: 'h1',
						Price: '.price',
						ImageURL: 'img@src'
						
					}])(function(err, result) {
						if (err) {
							reject(result);
							app.writeToErrorLog(err);
						} else {
							var date = new Date();
							result[0].Title = result[0].Title.slice(3, result[0].Title.length);
							result[0].URL = item;
							result[0].Time = date.toUTCString();
							result.map(function(item) {
								finalInfo.push(item);
							});
							if (finalInfo.length === itemCount) {
								resolve(finalInfo);
							}
						}
					});
				});
			});
		},
		
		/** 
		  * renderToCsv creates the csv file and stores it in the data folder
		*/
		
		renderToCsv: function(result) {
			var date = new Date();
			var csv = json2csv({data: result, fields: fields});
			fs.writeFile('./data/' + date.getFullYear() + "-" + String(Number(date.getUTCMonth() + 1)) + "-" + date.getUTCDate() + ".csv", csv, function(err) {
				if (err) {
					app.writeToErrorLog(err);
				} else {
					console.log('file saved');
				}
			});
		},
		
		/**
			* Write to error log does exactly that: Whenever an error occurs, this function is called
			* and the error is logged into a file.
		*/
		
		writeToErrorLog: function(error) {
			fs.stat('./data', function(err, stats) {
				if (err) {
					app.writeToErrorLog(err);
				} else {
					if (!stats) {
						fs.writeFile('./error-log.txt', error + "," + "[" + String(new Date().toUTCString()) + "]" + "\r\n", function(err) {
							if (err) {
								console.log(err);
								app.writeToErrorLog(err);
							} else {
								console.log(error);
							}
						});
					} else {
						fs.appendFile('./error-log.txt', error + "," + "[" + String(new Date().toUTCString()) + "]" + "\r\n", function(err) {
							if (err) {
								console.log(err);
								app.writeToErrorLog(err);
							} else {
								console.log(error);
							}
						});
					}
				}
			});
		}
	};
}());
app.init();

