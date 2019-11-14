class VersionBumpPlugin {
	constructor(options) { this.options = options; }

	bump() {
		let version = 0;
		if (this.options.file !== false) {
			let fs = require('fs');
			if (fs.existsSync(this.options.file)) version = fs.readFileSync(this.options.file);
			version++;
			fs.writeFileSync(this.options.file, version);
		}
		for (let i in this.options.hooks) this.options.hooks[i](version);
	}

	apply(compiler) {
		compiler.hooks.afterEmit.tap('VersionBumpPlugin', stats => { this.bump(); });
	}
}

module.exports = VersionBumpPlugin;