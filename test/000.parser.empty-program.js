var assert = require('assert');
var fs = require('fs');
var peg = require('pegjs');
function load_parser()
{
	var grammar = fs.readFileSync(__dirname + '/../src/grammar.pegjs', { encoding: 'utf8' });
	return peg.buildParser(grammar);
}
function make_empty_program()
{
	var parser = load_parser();
	var source_code = '';
	return parser.parse(source_code);
}
describe
(
	'Empty program', function()
	{
		it
		(
			"should produce an AST node of type \"Program\"", function()
			{
				var program = make_empty_program();
				assert.deepEqual(program.type, "Program");
			}
		);
		it
		(
			"should produce a Program node with a code block", function()
			{
				var program = make_empty_program();
				assert(program.code_block);
				assert.deepEqual(program.code_block.type, 'Block');
			}
		);
		it
		(
			"should produce a Program node with a code block with 0 child expressions", function()
			{
				var program = make_empty_program();
				assert.deepEqual(program.code_block.expressions.length, 0);
			}
		);
	}
);
