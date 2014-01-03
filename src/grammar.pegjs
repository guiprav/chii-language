Program
	= expression:Expression
	{
		return {
			type: "Program",
			code_block:
			{
				type: "Block",
				expressions: [expression]
			}
		};
	}
	/ ''
	{
		return {
			type: "Program",
			code_block:
			{
				type: "Block",
				expressions: []
			}
		};
	}
Expression
	= BooleanLiteral
	/ Block
Block
	= '{' expressions:BlockChildrenExpressions '}'
	{
		return {
			type: "Block",
			expressions: expressions
		};
	}
BlockChildrenExpressions
	= (expression:Expression ';' { return expression })*
BooleanLiteral
	= 'true'
	{
		return {
			type: "Boolean Literal"
		};
	}
