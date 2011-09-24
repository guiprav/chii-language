var util = require('util');
var TypeSystem = require('./chii_type_system');
var Type = TypeSystem.Type;
var Value = TypeSystem.Value;

var parseTree;

var ir =
{
	registerPool: new RegisterPool(),
	functions: {}
};

function RegisterPool()
{
	this.pool = [];
	
	this.add = function (data)
	{
		data.index = this.pool.length;
		
		this.pool.push(data);
		return data.index;
	}
}

function toLLVMStringLiteral(string)
{
	// todo: implement this shit properly
	
	var retn = '';
	
	for (var i = 0; i < string.length; ++i)
	{
		var charcode = string.charCodeAt(i);
		
		var printableASCII =
				(charcode >= 32 && charcode <= 126);
		
		var printableExtASCII =
				(charcode >= 128 && charcode <= 254);
		
		var unicode = (charcode >= 255);
		
		if (printableASCII || printableExtASCII)
		{
			retn += String.fromCharCode(charcode);
			continue;
		}
		
		if (!unicode)
		{
			var hex = charcode.toString(16);
			
			if (hex.length === 1)
			{
				hex = '0' + hex;
			}
			
			retn += '\\' + hex;
		}
		
		if (unicode)
		{
			throw 'unimplemented: string-literal unicode character support';
		}
	}
	
	return retn + '\\00';
}

var transformTopStatement =
{
	'function-declaration': function ()
	{
		if (ir.functions[this.name] !== undefined)
		{
			console.log('warning: redeclaration of function `' +
					this.name + '`');
		}
		
		for (var i = 0; i < this.args.args.length; ++i)
		{
			this.args.args[i] = Type(this.args.args[i]);
		}
		
		if (this.retnType !== undefined)
		{
			this.retnType = Type(this.retnType);
		}
		
		var fn = ir.functions[this.name] =
		{
			name: this.name,
			args: this.args,
			retnType: this.retnType
		};
		
		return fn;
	},
	
	'function-definition': function ()
	{
		var fn = transformTopStatement['function-declaration'].call(this);
		
		if (fn.body !== undefined)
		{
			throw 'error: redefinition of function `' + this.name + '`';
		}
		
		fn.registerPool = new RegisterPool();
		fn.stack = [];
		fn.body = [];
		
		for (var i = 0; i < this.body.statements.length; ++i)
		{
			var stmt = this.body.statements[i];
			transformBodyStatement[stmt.type].call(stmt, fn);
		}
		
		return fn;
	}
};

var transformBodyStatement =
{
	'function-call': function (parentFn)
	{
		var fn = transformExpression['function-call'].call(this, parentFn);
		
		parentFn.body.push(fn);
		return fn;
	},
	
	'return-statement': function (parentFn)
	{
		if (this.value === undefined)
		{
			if (parentFn.retnType === undefined)
			{
				parentFn.retnType = Type({ type: 'typename', name: 'void' });
			}
		}
		else
		{
			this.value =
					transformExpression['compute-body-expression'].
					call(this.value, parentFn);
			
			if (parentFn.retnType === undefined)
			{
				parentFn.retnType = this.value.type;
			}
		}
		
		parentFn.body.push(this);
		return this;
	}
};

var transformExpression =
{
	'function-call': function (parentFn)
	{
		for (var i = 0; i < this.args.length; ++i)
		{
			this.args[i] =
					transformExpression['compute-body-expression'].call(this.args[i], parentFn);
			
			// todo: fix type-checking
			/*var declSignature = ir.functions[this.name].args.args[i].signature;
			var argSignature = Type(this.args[i]).signature;

			if (declSignature !== argSignature)
			{
				throw 'error: wrong argument type #' + (i + 1) + " " +
						argSignature + " for call to function '" + this.name + "'; " +
						declSignature + " expected";
			}*/
		}
		
		return this;
	},
	
	'compute-body-expression': function (parentFn)
	{
		switch (this.type)
		{
			case 'bool':
			case 'int':
			case 'float':
			case 'double':
				return Value(this);
			break;
			
			case 'string-literal':
				var bufferLength = this.value.length + 1;
				
				var arrayReg = '@' + ir.registerPool.add
				(
					{
						type: 'llvm-global-constant',
						expression: 'internal constant [' + bufferLength +
								' x i8] c"' +toLLVMStringLiteral(this.value) + '"'
					}
				);
				
				var ptrReg = '%r' + parentFn.registerPool.add
				(
					{
						type: 'llvm-local-constant',
						expression: 'getelementptr inbounds [' + bufferLength +
						' x i8]* ' + arrayReg + ', i32 0, i32 0'
					}
				);
				
				return {
					type: 'register',
					isGlobalRegister: false,
					
					vtype: Type
					(
						{
							type: 'type',
							storageList: [],
							spec:
							{
								type: '$immutable',
								subject:
								{
									type: 'type',
									storageList: [],
									spec:
									{
										type: 'ptr',
										subject:
										{
											type: 'typename',
											name: 'int8'
										}
									}
								}
							}
						}
					),
					
					name: ptrReg
				};
			break;
			
			case 'function-call':
				var fnCall = transformExpression['function-call'].call(this, parentFn);
				var decl = ir.functions[fnCall.name];
				
				if (decl === undefined)
				{
					throw 'error: call to undefined function "' + this.name + '"';
				}
				
				fnCall.resultReg = '%r' + parentFn.registerPool.add
				(
					{
						type: 'function-call-result',
						call: fnCall
					}
				);
				
				parentFn.body.push(fnCall);
				
				return {
					type: 'register',
					isGlobalRegister: false,
					vtype: decl.retnType,
					name: fnCall.resultReg
				};
			break;
			
			default:
				throw 'unimplemented: "' + this.type + '"-type expressions';
			break;
		}
	}
};

module.exports.transform = function (ast, dumpIR)
{
	parseTree = ast; // todo: deep-copy
	
	console.log('; Building IR ...');
	
	for (var i = 0; i < parseTree.length; ++i)
	{
		var stmt = parseTree[i];
		transformTopStatement[stmt.type].call(stmt);
	}
	
	if (dumpIR)
	{
		console.log('ir = ' + util.inspect(ir, false, null) + '\n');
	}
	
	return ir;
}