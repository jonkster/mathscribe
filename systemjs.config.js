(function(global) {
    // map tells the System loader where to look for things
    var map = {
	'app':                        'app', // 'dist',
	'rxjs':                       'node_modules/rxjs',
	'angular2-grid':              'node_modules/angular2-grid/dist',
	'angular2-in-memory-web-api': 'node_modules/angular2-in-memory-web-api',
	'ng2-file-upload':            'node_modules/ng2-file-upload',
	'@angular':                   'node_modules/@angular'
    };
    // packages tells the System loader how to load when no filename and/or no extension
    var packages = {
	'app':                        { main: 'main.js',  defaultExtension: 'js' },
	'rxjs':                       { defaultExtension: 'js' },
	'ng2-file-upload':            { main: 'ng2-file-upload.js', defaultExtension: 'js' },
	'angular2-in-memory-web-api': { defaultExtension: 'js' },
	'angular2-grid':              { main: 'main.js', defaultExtension: 'js' },
    };
    var packageNames = [
	'@angular/common',
	'@angular/compiler',
	'@angular/core',
	'@angular/http',
	'@angular/platform-browser',
	'@angular/platform-browser-dynamic',
	'@angular/router',
	'@angular/router-deprecated',
	'@angular/testing',
	'@angular/upgrade',
    ];
    // add package entries for angular packages in the form '@angular/common': { main: 'index.js', defaultExtension: 'js' }
    packageNames.forEach(function(pkgName) {
	packages[pkgName] = { main: 'index.js', defaultExtension: 'js' };
    });
    var config = {
	map: map,
	packages: packages
    }
    System.config(config);
})(this);

