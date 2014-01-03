var assert = require('assert');
var fs = require('fs');
var peg = require('pegjs');
var grammar = fs.readFileSync(__dirname + '/../src/grammar.pegjs', { encoding: 'utf8' });
var parser = peg.buildParser(grammar);
describe
(
	'Empty program', function()
	{
		it
		(
			"should produce the right AST", function()
			{
				var source_code = '';
				var produced_ast = parser.parse(source_code);
				var expected_ast =
				{
					type: "Program"
				};
				assert.deepEqual(produced_ast, expected_ast);
			}
		);
	}
);
