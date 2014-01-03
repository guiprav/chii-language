var assert = require('assert');
var fs = require('fs');
var peg = require('pegjs');
var grammar = fs.readFileSync(__dirname + '/../src/grammar.pegjs', { encoding: 'utf8' });
var parser = peg.buildParser(grammar);
describe
(
	'Empty program', function()
	{
		var source_code = '';
		var program = parser.parse(source_code);
		it
		(
			"should produce an AST node of type \"Program\"", function()
			{
				assert.deepEqual(program.type, "Program");
			}
		);
		it
		(
			"should produce an AST node with 0 child statements", function()
			{
				assert.deepEqual(program.statements.length, 0);
			}
		);
	}
);
