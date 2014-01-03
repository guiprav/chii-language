var assert = require('assert');
var fs = require('fs');
var peg = require('pegjs');
var grammar = fs.readFileSync(__dirname + '/../src/grammar.pegjs', { encoding: 'utf8' });
var parser = peg.buildParser(grammar);
describe
(
	'Empty block expression', function()
	{
		var source_code = '{}';
		var block = parser.parse(source_code).code_block.expressions[0];
		it
		(
			"should produce an AST node of type \"Block\"", function()
			{
				assert.deepEqual(block.type, "Block");
			}
		);
	}
);
