var IR;

var util = require('util');
var TypeSystem = require('./chii_type_system');
var Type = TypeSystem.Type;
var TypeOf = TypeSystem.TypeOf;
var Value = TypeSystem.Value;

var generateTopAsm =
{
	'llvm-global-constant': function ()
	{
		return '@' + this.index + ' = ' + this.expression + '\n';
	},
	
	'function': function ()
	{
		var asm = '';
		
		if (this.body === undefined)
			asm += 'declare ';
		else
			asm += 'define ';
		
		var arglist = '';
		
		for (var i = 0; i < this.args.args.length; ++i) // todo: remove args duplicate property
		{
			arglist += this.args.args[i].llvmType;
			
			if (i < this.args.args.length - 1 || this.args.variadic)
			{
				arglist += ', ';
			}
		}
		
		if (this.args.variadic)
		{
			arglist += '...';
		}
		
		asm += this.retnType.llvmType + ' @' +
				this.name + ' (' + arglist + ')';
		
		if (this.body !== undefined)
		{
			asm += ' {\n';
			asm += 'entry:\n';
			
			asm += '    ; local registers constants\n';
			for (var i = 0; i < this.registerPool.pool.length; ++i)
			{
				var reg = this.registerPool.pool[i];
				
				if (reg.type === 'llvm-local-constant')
				{
					asm += '    %r' + reg.index + ' = ' + reg.expression + '\n';
				}
			}
			
			asm += '\n';
			for (var i = 0; i < this.body.length; ++i)
			{
				var stmt = this.body[i];
				asm += '    ' + generateBodyAsm[stmt.type].call(stmt);
			}
			
			asm += '}';
		}
		
		asm += '\n';
		
		return asm;
	}
};

var generateBodyAsm =
{
	'function-call': function ()
	{
		var decl = IR.functions[this.name];
		
		var arglist = '';
		for (var i = 0; i < decl.args.args.length; ++i)
		{
			arglist += decl.args.args[i].llvmType;
			
			if (i < decl.args.args.length - 1 || decl.args.variadic)
			{
				arglist += ', ';
			}
		}
		
		if (decl.args.variadic)
		{
			arglist += '...';
		}
		
		var callarglist = '';
		for (var i = 0; i < this.args.length; ++i)
		{
			var arg = this.args[i];
			
			if (arg.type === 'register')
			{
				callarglist += arg.vtype.llvmType + ' ' + arg.name;
			}
			else
			{
				callarglist += arg.type.llvmType + ' ' + arg.llvmValue;
			}
			
			if (i < this.args.length - 1)
			{
				callarglist += ', ';
			}
		}
		
		var retn = '';
		
		if (this.resultReg !== undefined)
		{
			retn += this.resultReg + ' = ';
		}
		
		retn += 'call ' + decl.retnType.llvmType +
				' (' + arglist + ')* @' + this.name + '(' + callarglist + ')\n';
		
		return retn;
	},
	
	'return-statement': function ()
	{
		if (this.value === undefined)
		{
			return 'ret void\n';
		}
		else
		{
			return 'ret ' + this.value.type.llvmType + ' ' + this.value.llvmValue + '\n';
		}
	}
};

module.exports.compile = function (ir, dumpAsm, run)
{
	IR = ir;
	
	console.log('; Emitting LLVM assembly ...');
	
	var asm = '; global registers\n';
	for (var i = 0; i < IR.registerPool.pool.length; ++i)
	{
		var reg = IR.registerPool.pool[i];
		asm += generateTopAsm[reg.type].call(reg);
	}
	
	asm += '\n';
	
	asm += '; functions\n';
	for (var i in IR.functions)
	{
		var fn = IR.functions[i];
		asm += generateTopAsm['function'].call(fn);
	}
	
	if (dumpAsm)
	{
		console.log(';--- <LLVM assembly dump>\n' +
				asm + ';--- </LLVM assembly dump>');
	}
	
	return asm;
}