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
	= '{}'
	{
		return {
			type: "Block",
			expressions: []
		};
	}
BooleanLiteral
	= 'true;'
	{
		return {
			type: "Boolean Literal"
		};
	}
