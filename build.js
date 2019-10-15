let glob = require("glob");
let path = require("path");
let fs = require("fs");

class BuildConfigReader{

	static load(path){
		let config = JSON.parse(fs.readFileSync(path, {encoding: 'UTF-8'}));
		return new BuildConfigReader(config);
	}

	constructor(config){this.config = config;}

	get googlefonts(){return this.config.googlefonts; }
	get buildVersionFile(){return this.config.buildVersionFile; }
	get copy(){return this.config.copy; }
	get css(){return this.config.css; }
	get js(){return this.config.js; }
	get cssEntries(){ return this.constructor.getEntries(this.css, '*.less'); }

	get jsEntries(){
		return this.constructor.getEntries(this.js, '*.js', (entry) => {
			return {
				key  : entry.dest + entry.base,
				value: entry.src + entry.file
			};
		});
	}

	static getEntries(paths, pattern, converter = null){
		let entries = [];
		paths.forEach(pathEntry => {
			glob.sync(pattern, {cwd: pathEntry.src}).forEach(file => entries.push({
				src : pathEntry.src,
				dest: pathEntry.dest,
				file: file,
				ext : path.extname(file),
				base: file.slice(0, -path.extname(file).length)
			}));
		});
		if(converter !== null){
			let convertedEntries = {};
			entries.forEach(entry => {
				entry = converter(entry);
				convertedEntries[entry.key] = entry.value;
			});
			entries = convertedEntries;
		}
		return entries;
	}
};

class VersionBumpPlugin {
	constructor(options) { this.options = options; }

	bump(){
		let fs = require('fs');
		let version = 0;
		if (fs.existsSync(this.options.file)) version = fs.readFileSync(this.options.file);
		version ++;
		fs.writeFileSync(this.options.file, version);
	}

	apply(compiler) {
		compiler.hooks.done.tap('VersionBumpPlugin', stats => { this.bump(); });
	}
}


module.exports = {
	ConfigReader: BuildConfigReader,
	VersionBump: VersionBumpPlugin
}