#!/usr/bin/node

var args = process.argv;

// removes ['node', 'chew.js']
args.shift();
args.shift();

if (args.length !== 1 && args.length !== 2)
{
	console.log('[X] wrong number of arguments');
	console.log('usage: chew.js [-rid] [source.chii]');
	
	return 0;
}

var sourcePath;
var run = false, dumpIR = false, dumpAsm = false;

if (args.length === 1)
{
	sourcePath = args[0];
}
else
{
	var opts = args[0];
	sourcePath = args[1];
	
	if (opts.charAt(0) !== '-')
	{
		console.log('[X] unexpected argument type "' + opts + '"');
		console.log('usage: chew.js [-rid] [source.chii]');
		
		return 0;
	}
	
	if (opts.indexOf('r') !== -1)
		run = true;
	if (opts.indexOf('i') !== -1)
		dumpIR = true;
	if (opts.indexOf('d') !== -1)
		dumpAsm = true;
}

var fs = require('fs');

fs.readFile
(
	sourcePath, function (err, data)
	{
		if (err) throw err;
		data = data.toString();
		
		var ast = require('./chii_parser').parse(data);
		console.log('; Parse OK');
		
		var ir = require('./chii_ast_transformer').transform(ast, dumpIR);
		console.log('; Transform OK');
		
		var llCode =
				require('./chii_compiler').compile(ir, dumpAsm, run);
		
		console.log('; Compile OK');
	}
);
