#!/usr/bin/env node

const GetGoogleFonts = require('get-google-fonts');
const path = require('path');
let cfg = require(process.env.PWD + '/package.json')['google-fonts'];
if(typeof cfg === 'string') cfg = require(process.env.INIT_CWD + '/' + cfg);


if(!(cfg instanceof Array)) cfg = [cfg];

for(let i in cfg){
	let config = cfg[i];

	let options = {
		outputDir:  resolvePath(config.location, false),
		path:       config["url-font-path"],
		template:   '{_family}-{weight}-{comment}{i}.{ext}',
		cssFile:    path.relative(resolvePath(config.location), resolvePath(config.css, false)),
		userAgent:  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
			'(KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
		base64:      false,
		strictSSL:   true,
		overwriting: true,
		verbose:     true,
		simulate:    false
	};
	(new GetGoogleFonts(options)).download([config.fonts]);
}

function resolvePath(file, rel = true) {
	if (file.substr(0, 1) !== '/') file = path.resolve(process.env.PWD, file);
	if (rel) file = './' + path.relative(process.env.PWD, file);
	return file;
}