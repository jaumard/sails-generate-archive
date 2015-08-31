# sails-generate-archive

An `archive` generator for use with the Sails command-line interface.

This generate create a zip file (named "archiveX.X.X.zip") under a .archives folder who contains every files for a production server.

## How does it works ? 
The generator build all your assets files (js, css...) by lifting sails in production mode and then include all files in .tmp/public in zip file.

The generator also include all this file : 

```
["/api", "/config", "/tasks", "/views", "/Gruntfile.js", "/app.js", "/package.json", "/.sailsrc"]
```

Like this all you have to do with the zip file is unzip it, make an npm install and then lift sails in production mode.

Sails will start quickly cause they only copy /assets folder in .tmp/public and it doesn't rebuild them.

## Why should I use this ?
If you use a server with low resources or if you deploy you project on a board like Raspberry PI. Your project will stat quickly because grunt tasks don't rebuild assets.

### Installation

Globally to use on every project you have (need to install sails globally too)

```sh
$ npm install -g sails-generate-archive
```

or for one project

```sh
$ npm install sails-generate-archive
```


### Usage

##### On the command line

```sh
$ sails generate archive 
```

### Configuration 
If you want to put other files in archives just add a /config/archive.js file like this : 

```
module.exports.archive = {
	filesToArchive : ["/file1.js", "/testFolder"]
};
```

### Development

To get started quickly and see this generator in action, ...

Also see `CONTRIBUTING.md` for more information on overriding/enhancing existing generators.



### Questions?

See `FAQ.md`.



### More Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>


### License

**[MIT](./LICENSE)**
&copy; 2015 [balderdashy](http://github.com/balderdashy) & contributors

As for [Sails](http://sailsjs.org)?  It's free and open-source under the [MIT License](http://sails.mit-license.org/).

![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)
