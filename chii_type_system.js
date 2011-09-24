var util = require('util');

function Type(obj)
{
	if (this === global)
	{
		return new Type(obj);
	}
	
	this.isDynamic = false;
	this.isConst = false;
	this.isImmutable = false;
	this.isArray = false;
	this.isPtr = false;
	
	switch (obj.type)
	{
		case 'register': // todo: this should be Type.Of()
			return Type(obj.vtype);
		break;
		
		case 'bool': // todo: this should be Type.Of()
		case 'int':
		case 'float':
		case 'double':
			return Type({ type: 'typename', name: obj.type });
		break;
		
		case 'type':
			var spec = Type(obj.spec);
			this.signature = '';
			
			for (var i = 0; i < obj.storageList.length; ++i)
			{
				var storage = obj.storageList[i];
				
				switch (storage)
				{
					case 'dynamic':
						this.isDynamic = true;
					break;
					
					default:
						throw 'error: invalid storage class "' + storage + '"';
					break;
				}
				
				this.signature += storage;
				
				if (i < obj.storage.length - 1)
				{
					this.signature += ',';
				}
				
				if (i === obj.storage.length - 1)
				{
					this.signature += ':';
				}
			}
			
			this.signature += spec.signature;
			this.llvmType = spec.llvmType;
		break;
		
		case '$const':
		    var subject = Type(obj.subject);
			
			this.isConst = true;
			this.signature = 'const(' + subject.signature + ')';
			this.llvmType = subject.llvmType;
		break;
		
		case '$immutable':
			var subject = Type(obj.subject);
			
			this.isImmutable = true;
			this.signature = 'immutable(' + subject.signature + ')';
			this.llvmType = subject.llvmType;
		break;
		
		case 'array':
			var subject = Type(obj.subject);
			
			this.isArray = true;
			this.signature = subject.signature + '[' + obj.size + ']';
			this.llvmType = '[' + obj.size + ' x ' + subject.llvmType + ']';
		break;
		
		case 'ptr':
			var subject = Type(obj.subject);
			
			this.isPtr = true;
			this.signature = subject.signature + '*';
			this.llvmType = subject.llvmType + '*';
		break;
		
		case 'typename':
			this.isTypename = true;
			this.signature = obj.name;
			
			if (llvmNativeTypes[obj.name] === undefined)
			{
				console.trace();
				throw 'unimplemented: structured data types';
			}
			else
			{
				this.llvmType = llvmNativeTypes[obj.name];
			}
		break;
		
		default:
			console.trace();
			console.log(util.inspect(obj));
			throw 'error: invalid type "' + obj.type + '"';
		break;
	}
	
	if (Type.List[this.signature] === undefined)
	{
		Type.List[this.signature] = this;
	}
	
	return Type.List[this.signature];
}

Type.Get = function (signature)
{
	return Type.List[signature];
}

Type.List = {};

function Value(obj)
{
	if (this === global)
	{
		return new Value(obj);
	}
	
	switch (obj.type)
	{
		case 'bool':
		case 'int':
			this.type = Type({ type: 'typename', name: obj.type });
			
			this.value = obj.value;
			this.llvmValue = obj.value;
		break;
		
		case 'float':
		case 'double':
			this.type = Type({ type: 'typename', name: obj.type });
			
			this.value = obj.value;
			
			if (Math.round(obj.value) === obj.value)
			{
				// forces real notation (1 becomes 1.0, etc.)
				this.llvmValue = obj.value + '.0';
			}
		break;
		
		default:
			console.trace();
			throw 'unimplemented: "' + obj.type +
					'" value type conversion to LLVM value';
		break;
	}
}

var llvmNativeTypes =
{
	'void': 'void',
	
	'bool': 'i1',
	'int': 'i32',
	'float': 'float',
	'double': 'double',
	
	'int8' :  'i8', 'uint8' :  'i8',
	'int16': 'i16', 'uint16': 'i16',
	'int32': 'i32', 'uint32': 'i32',
	'int64': 'i64', 'uint64': 'i64'
};

module.exports.Type = Type;
module.exports.Value = Value;