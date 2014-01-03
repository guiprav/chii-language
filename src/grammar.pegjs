Program
	= literal:BooleanLiteral
	{
		return {
			type: "Program",
			code_block:
			{
				type: "Block",
				expressions: [literal]
			}
		};
	}
	/ block:Block
	{
		return {
			type: "Program",
			code_block:
			{
				type: "Block",
				expressions: [block]
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
