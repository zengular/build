let path = require("path");
let VersionBumpPlugin = require('./version-bump-plugin');
let GGF = require("./")

class ZengularBuild {

	constructor(cfg = false) {

		if (cfg === false) cfg = require(process.env.INIT_CWD + '/package.json')['z-build'];
		this.root = process.env.INIT_CWD;

		this.devtool = typeof cfg.devtool !== "undefined" ? cfg.devtool : false;
		this.copy = [];
		this.entries = {};
		this.aliases = typeof cfg.aliases !== "undefined" ? cfg.aliases : {};
		this.verbumpfile = typeof cfg.verbump !== "undefined" ? cfg.verbump : false;
		this.buildHooks = [];

		Object.keys(cfg.entries).forEach(key => this.entries[cfg.entries[key]] = this.resolvePath(key));

		if (typeof cfg.copy !== 'undefined') {
			for (let src in cfg.copy) {
				let from, context;
				let parts = src.split('//', 2);
				if (parts.length === 2) {
					context = parts[0] + '/';
					from = parts[1];
				} else {
					from = path.basename(src);
					context = this.resolvePath(path.dirname(src)) + '/';
				}
				let to = this.resolvePath(cfg.copy[src]) + '/';
				this.copy.push({from, context, to, force: true});
			}
		}
	}

	addBuildHook(fn) { this.buildHooks.push(fn);}

	get verbump() {return new VersionBumpPlugin({file: this.verbumpfile, hooks: this.buildHooks});}

	resolvePath(file, rel = true) {
		if (file.substr(0, 1) !== '/') file = path.resolve(this.root, file);
		if (rel) file = './' + path.relative(this.root, file);
		return file
	}
}


module.exports = ZengularBuild;