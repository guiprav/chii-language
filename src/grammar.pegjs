Program
	= block:Block
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
