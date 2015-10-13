/**
 * Module dependencies
 */

var util   = require('util');
var _      = require('lodash');
var async = require('async');
_.defaults = require('merge-defaults');


/**
 * sails-generate-archive
 *
 * Usage:
 * `sails generate archive`
 *
 * @description Generates a archive
 * @help See http://links.sailsjs.org/docs/generators
 */
var fs   = require("fs-extra");
var path = require("path");

var rmdir = function (dir)
{
	var list = fs.readdirSync(dir);
	for (var i = 0; i < list.length; i++)
	{
		var filename = path.join(dir, list[i]);
		var stat     = fs.statSync(filename);

		if (filename == "." || filename == "..")
		{
			// pass these files
		}
		else if (stat.isDirectory())
		{
			// rmdir recursively
			rmdir(filename);
		}
		else
		{
			// rm fiilename
			fs.unlinkSync(filename);
		}
	}
	fs.rmdirSync(dir);
};

module.exports = {

	/**
	 * `before()` is run before executing any of the `targets`
	 * defined below.
	 *
	 * This is where we can validate user input, configure default
	 * scope variables, get extra dependencies, and so on.
	 *
	 * @param  {Object} scope
	 * @param  {Function} cb    [callback]
	 */

	before    : function (scope, cb)
	{
		scope.filesToArchive = [];
		scope.removeFolder = true;
		var me               = this;

		if (scope.args.length > 0)
		{
			scope.filesToArchive = scope.args;
		}

		// scope.rootPath is the base path for this generator
		//
		// e.g. if this generator specified the target:
		// './Foobar.md': { copy: 'Foobar.md' }
		//
		// And someone ran this generator from `/Users/dbowie/sailsStuff`,
		// then `/Users/dbowie/sailsStuff/Foobar.md` would be created.
		if (!scope.rootPath)
		{
			return cb(INVALID_SCOPE_VARIABLE('rootPath'));
		}

		// Attach defaults
		_.defaults(scope, {
			createdAt : new Date()
		});
		var sails;
		try
		{
			sails = require(scope.rootPath + "/node_modules/sails");
		}
		catch (e)
		{
			console.error('Not a sails project');
			console.error('');
			return;
		}
		console.info("Building production assets...");
		sails.load({
			environment : "production",
			port        : 1338,
			log         : {
				level : "silent"
			}
		}, function (err)
		{
			if (err)
			{
				cb(err);
			}
			else
			{
				if (sails.config.archive)
				{
					scope = _.merge(scope, sails.config.archive);
				}
				var project = require(scope.rootPath + "/package.json");
				var myPath  = scope.rootPath + "/.archives";
				if (!fs.existsSync(myPath))
				{
					fs.mkdirSync(scope.rootPath + "/.archives");
				}

				myPath += "/archive" + project.version;

				if (fs.existsSync(myPath))
				{
					var yesno = require('yesno');
					yesno.ask("archive" + project.version + ' already exist, do you want to override it ?', true, function (ok)
					{
						if (ok)
						{
							rmdir(myPath);
							me.copyFiles(scope, myPath, cb);
						}
						else
						{
							process.exit();//Kill sails server and exit script
						}
					});
				}
				else
				{
					me.copyFiles(scope, myPath, cb);
				}
			}
		});
	},
	copyFiles : function (scope, myPath, cb)
	{
		var project = require(scope.rootPath + "/package.json");
		fs.mkdirSync(myPath);

		var filesToCopy = ["/api", "/config", "/tasks", "/views", "/Gruntfile.js", "/app.js", "/package.json", "/.sailsrc"].concat(scope.filesToArchive);

		async.parallel([function (cb)
		{
			async.each(filesToCopy, function (fileToCopy, next)
			{
				console.log("Copying " + fileToCopy + "...");
				fs.copy(scope.rootPath + fileToCopy, myPath + fileToCopy, function (err)
				{
					next(err);
				});

			}, function ()
			{
				console.log("Server files done");
				fs.unlinkSync(myPath + "/config/local.js");
				fs.unlinkSync(myPath + "/tasks/register/prod.js");

				fs.writeFile(myPath + "/tasks/register/prod.js", "module.exports = function (grunt){grunt.registerTask('prod', ['copy:dev']);};", function (err)
				{
					console.log("local.js deleted and prod.js modified");
					cb(err);
				});
			});
		}, function (cb)
		{
			var assetsPath = myPath + "/assets/";
			fs.mkdirSync(assetsPath);
			var tmpDir     = scope.rootPath + "/.tmp/public";
			var files      = fs.readdirSync(tmpDir);

			async.each(files, function (fileToCopy, next)
			{
				console.log("Copying " + fileToCopy + "...");
				fs.copy(scope.rootPath + "/.tmp/public/" + fileToCopy, assetsPath + fileToCopy, function (err)
				{
					next(err);
				});

			}, function (err)
			{
				cb(err);
			});
		}], function (err)
		{
			if (err)
			{
				cb(err);
			}
			else
			{
				var Zip = require('machinepack-zip');

				//myPath = path.resolve(myPath, "..");
				console.info("Archiving files...");
				// Compress the specified source files or directories into a .zip file.
				Zip.zip({
					sources : [myPath + "/*"],
					destination : myPath + "/../archive" + project.version + ".zip"
				}).exec({
					// An unexpected error occurred.
					error   : function (err)
					{
						cb(err);
					}, // OK.
					success : function (result)
					{
						if (scope.removeFolder)
						{
							rmdir(myPath + "/");
						}
						// When finished, we trigger a callback with no error
						// to begin generating files/folders as specified by
						// the `targets` below.
						console.info("Build archive " + project.version + " done");
						cb();
						process.exit();//Kill sails server and exit script
					}
				});
			}
		});
	},

	/**
	 * The files/folders to generate.
	 * @type {Object}
	 */

	targets : {},

	/**
	 * The absolute path to the `templates` for this generator
	 * (for use with the `template` helper)
	 *
	 * @type {String}
	 */
	templatesDirectory : __dirname
};


/**
 * INVALID_SCOPE_VARIABLE()
 *
 * Helper method to put together a nice error about a missing or invalid
 * scope variable. We should always validate any required scope variables
 * to avoid inadvertently smashing someone's filesystem.
 *
 * @param {String} varname [the name of the missing/invalid scope variable]
 * @param {String} details [optional - additional details to display on the console]
 * @param {String} message [optional - override for the default message]
 * @return {Error}
 * @api private
 */

function INVALID_SCOPE_VARIABLE(varname, details, message)
{
	var DEFAULT_MESSAGE = 'Issue encountered in generator "archive":\n' + 'Missing required scope variable: `%s`"\n' + 'If you are the author of `sails-generate-archive`, please resolve this ' + 'issue and publish a new patch release.';

	message = (message || DEFAULT_MESSAGE) + (details ? '\n' + details : '');
	message = util.inspect(message, varname);

	return new Error(message);
}
