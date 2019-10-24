let glob = require("glob");
let path = require("path");
let fs = require("fs");


class ConfigBuilder {

	constructor(dirname, root, buildVersionFile) {
		this.dirname = dirname;
		this.root = this.resolvePath(root);
		this.config = {
			copy: [],
			js: {},
			less: [],
			buildVersionFile: this.resolvePath(buildVersionFile)
		};
	}

	copy(src, dest, watch = false) {
		let pattern = path.basename(src);
		src = this.resolvePath(path.dirname(src)) + '/';
		dest = this.resolvePath(dest) + '/';
		this.config.copy.push({src, pattern, watch, dest});
	}

	setupGoogleFonts(dest, baseUrl) {
		this.config.googlefonts = {src: [], dest: this.resolvePath(dest), baseUrl};
	}

	gfCfg(file) {
		file = this.resolvePath(file);
		let dir = path.dirname(file);
		let config = JSON.parse(fs.readFileSync(file, {encoding: 'UTF-8'}));
		config.css = this.resolvePath(config.css, dir);
		this.config.googlefonts.src.push(config);
	}

	jsCfg(file) { this.loadPathPairs(file).forEach(({src, dest}) => this.js(src, dest));}
	lessCfg(file) { this.loadPathPairs(file).forEach(({src, dest}) => this.less(src, dest));}


	js(src, dest) { this.config.js[this.relativePath(this.resolvePath(dest))] = this.relativePath(this.resolvePath(src)); }
	less(src, dest) { this.config.less.push({src: this.relativePath(src), dest: this.relativePath(dest)}); }


	loadPathPairs(file) {
		file = this.resolvePath(file);
		let cfg = JSON.parse(fs.readFileSync(file, {encoding: 'UTF-8'}));
		let dir = path.dirname(file);
		let pairs = [];
		for (let src in cfg) {
			let dest = this.resolvePath(cfg[src], dir);
			src = this.resolvePath(src, dir);
			pairs.push({src, dest});
		}
		return pairs;
	}

	relativePath(file, dir = null) {
		if (dir === null) dir = this.root;
		return './'+path.relative(dir, file);
	}

	resolvePath(file, dir = null) {
		if (dir === null) dir = this.dirname;
		if (file.substr(0, 1) === '.') {
			return path.resolve(dir, file);
		} else if (file.substr(0, 1) === '/') {
			return file;
		} else {
			return path.resolve(this.root, file);
		}
	}
}


class BuildConfigReader {

	static load(path) {
		let config = JSON.parse(fs.readFileSync(path, {encoding: 'UTF-8'}));
		return new BuildConfigReader(config);
	}

	constructor(config) {this.config = config;}

	get googlefonts() {return this.config.googlefonts; }
	get buildVersionFile() {return this.config.buildVersionFile; }
	get copy() {return this.config.copy; }
	get css() {return this.config.css; }
	get js() {return this.config.js; }
	get cssEntries() { return this.constructor.getEntries(this.css, '*.less'); }

	get jsEntries() {
		return this.constructor.getEntries(this.js, '*.js', (entry) => {
			return {
				key: entry.dest + entry.base,
				value: entry.src + entry.file
			};
		});
	}

	static getEntries(paths, pattern, converter = null) {
		let entries = [];
		paths.forEach(pathEntry => {
			glob.sync(pattern, {cwd: pathEntry.src}).forEach(file => entries.push({
				src: pathEntry.src,
				dest: pathEntry.dest,
				file: file,
				ext: path.extname(file),
				base: file.slice(0, -path.extname(file).length)
			}));
		});
		if (converter !== null) {
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

	bump() {
		let fs = require('fs');
		let version = 0;
		if (fs.existsSync(this.options.file)) version = fs.readFileSync(this.options.file);
		version++;
		fs.writeFileSync(this.options.file, version);
	}

	apply(compiler) {
		compiler.hooks.done.tap('VersionBumpPlugin', stats => { this.bump(); });
	}
}


module.exports = {
	ConfigReader: BuildConfigReader,
	ConfigBuilder: ConfigBuilder,
	VersionBump: VersionBumpPlugin
}