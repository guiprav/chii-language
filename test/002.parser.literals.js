var assert = require('assert');
var fs = require('fs');
var peg = require('pegjs');
function load_parser()
{
	var grammar = fs.readFileSync(__dirname + '/../src/grammar.pegjs', { encoding: 'utf8' });
	return peg.buildParser(grammar);
}
function parse_literal(literal)
{
	var parser = load_parser();
	var source_code = literal + ';';
	return parser.parse(source_code).code_block.expressions[0];
}
describe
(
	'true (boolean literal)', function()
	{
		it
		(
			"should produce an AST node of type \"Boolean Literal\"", function()
			{
				var literal = parse_literal('true');
				assert.deepEqual(literal.type, "Boolean Literal");
			}
		);
	}
);
