start = top_statements

top_statements "top-level statements"
  = stmt:top_statement opt:(sp* top_statements)?
    {
       var more = opt[1];

        if (more !== undefined)
        {
            more.unshift(stmt);
            return more;
        }

        return [stmt];
    }

top_statement
  = stmt:variable_declaration ';' { return stmt; }
  / stmt:variable_definition ';' { return stmt; }
  / stmt:function_declaration ';' { return stmt; }
  / stmt:function_definition { return stmt; }

function_declaration
  = '$fn' sp+ name:identifier sp* args:argument_declaration_list opt:(sp* type)?
    {
        var retnType = opt[1];
        var fn = { type: 'function-declaration', name: name, args: args };

        if (retnType !== undefined)
        {
            fn.retnType = retnType;
        }

        return fn;
    }

function_definition
  = fn:function_declaration sp* body:body_statements
    {
        fn.type = 'function-definition';
        fn.body = body;

        return fn;
    }

argument_declaration_list
  = '(' sp* ')'
    {
        return {
            type: 'argument-declaration-list',
            args: [], variadic: false
        };
    }

  / '(' sp* args:argument_declaration_list_noparens sp* ')'
    {
        return {
            type: 'argument-declaration-list',
            args: args, variadic: false
        };
    }

  / '(' sp* '...' sp* ')'
    {
        return {
            type: 'argument-declaration-list',
            args: [], variadic: true
        };
    }

  / '(' sp* args:argument_declaration_list_noparens sp*
    ',' sp* '...' sp* ')'
    {
        return {
            type: 'argument-declaration-list',
            args: args, variadic: true
        };
    }

argument_declaration_list_noparens
  = arg:(variable_declaration / type)
    opt:(sp* ',' sp* argument_declaration_list_noparens)?
    {
        var more = opt[3];

        if (more !== undefined)
        {
            more.unshift(arg);
            return more;
        }

        return [arg];
    }

argument_declaration
  = opt:(type? (sp* identifier)?)?
    {
        var type = opt[0];
        var name = opt[1][1];

        var arg = { type: 'variable-declaration' };

        if (type !== undefined)
        {
            arg.vtype = type;
        }

        if (name !== undefined)
        {
            arg.name = name;
        }

        return arg;
    }

body_statements
  = '{' sp* '}' { return { type: 'body-statements', statements: [] }; }

  / '{' sp* body:body_statements_internal sp* '}'
    {
        return { type: 'body-statements', statements: body };
    }

body_statements_internal
  = stmt:body_statement opt:(sp* body_statements_internal)?
    {
        var more = opt[1];

        if (more !== undefined)
        {
            more.unshift(stmt);
            return more;
        }

        return [stmt];
    }

body_statement
  = stmt:variable_declaration sp* ';' { return stmt; }
  / stmt:variable_definition sp* ';' { return stmt; }
  / stmt:expression sp* ';' { return stmt; }
  / '$return' sp* value:expression sp* ';' { return { type: 'return-statement', value: value }; }
  / '$return' sp* ';' { return { type: 'return-statement' }; }

variable_declaration
  = type:type sp* name:identifier
    {
        return {
            type: 'variable-declaration',
            vtype: type, name: name
        };
    }

  / variable_keyword sp+ name:identifier
    {
        return { type: 'variable-declaration', name: name };
    }

variable_definition "variable definition"
  = variable:variable_declaration sp* '=' sp* init:expression
    {
        variable.type = 'variable-definition';
        variable.init = init;

        return variable;
    }

variable_keyword
  = '$auto' { return 'var'; }

type "type"
  = opt1:(storage_classes sp+)?
    type:(type_constructor / typename) opt2:(sp* type_modifiers)?
    {
        var storageList = opt1[0];

        if (storageList === undefined)
        {
            storageList = [];
        }

        var modifiers = opt2[1];

        // no modifiers? just return type
        if (modifiers === undefined)
        {
            return {
                type: 'type',

                storageList: storageList,
                spec: type
            };
        }

        // append type to end of modifier chain
        var modifier = modifiers;

        while (modifier.subject !== undefined)
        {
            modifier = modifier.subject;
        }

        modifier.subject = type;

        // type is modifier chain with itself appended
        type =
        {
            type: 'type',

            storageList: storageList,
            spec: modifiers
        };

        type.storageList = storageList;
        return type;
    }

storage_classes
  = cls:storage_class_keyword opt:(sp+ storage_classes)?
    {
        var more = opt[1];

        if (more !== undefined)
        {
            more.push(cls);
            return more;
        }

        return [cls];
    }

storage_class_keyword = '$dynamic'

type_constructor
  = ctor:type_constructor_keyword sp* '(' sp* type:type sp* ')'
    {
        return { type: ctor, subject: type };
    }

type_constructor_keyword = '$const' / '$immutable'

typename
  = name:identifier { return { type: 'typename', name: name }; }

type_modifiers "type modifiers"
  = internal:type_modifiers_internal { return internal.head; }

type_modifiers_internal
  = modifier:type_modifier opt:(sp* type_modifiers_internal)?
    {
        var more = opt[1];

        if (more === undefined)
        {
            more = { head: modifier };
        }
        else
        {
            more.current.subject = modifier;
        }

        return { head: more.head, current: modifier };
    }

type_modifier
  = '*'                          { return { type: 'ptr' }; }
  / '[]'                         { return { type: 'array' }; }
  / '[' sp* size:integer sp* ']' { return { type: 'array', size: size }; }

expression = decimal / string_literal / '<expr>' / function_call / symbol

function_call
  = name:identifier sp* args:value_list
    {
        return { type: 'function-call', name: name, args: args.values };
    }

value_list
  = '(' sp* ')' { return { type: 'value-list', values: [] }; }

  / '(' sp* values:value_list_noparens sp* ')'
    {
        return { type: 'value-list', values: values };
    }

value_list_noparens
  = value:expression opt:(sp* ',' sp* value_list_noparens)?
    {
        var more = opt[3];

        if (more !== undefined)
        {
            more.unshift(value);
            return more;
        }

        return [value];
    }

symbol
  = text:identifier { return { type: 'symbol', value: text }; }

identifier "identifier"
  = text:([_a-zA-Z][_a-zA-Z0-9]*) { return text[0] + text[1].join(''); }

decimal "decimal" = real / integer / character_literal

real "real"
  = [-+]? '0'? '.0' [fF]?
    { return { type: 'double', value: 0.0 }; }

  / text:([-+]? [1-9] [0-9]* '.' [0-9]*) [fF]?
    {
        var value = parseFloat(text[0] + text[1] +
                text[2].join('') + '.' + text[4].join(''));

        return { type: 'double', value: value };
    }

  / text:([-+]? '.' [0-9]*) [fF]?
    {
        var value = parseFloat(text[0] + '0.' + text[2].join(''));
        return { type: 'double', value: value };
    }

integer "integer"
  = [-+]? '0' { return { type: 'int', value: 0 }; }

  / text:([-+]?[1-9][0-9]*)
    {
        var value = parseInt(text[0] + text[1] + text[2].join(''));
        return { type: 'int', value: value };
    }

  / '0x' text:[0-9a-fA-F]+
    {
        var value = parseInt(text.join(''), 16);
        return { type: 'int', value: value };
    }

  / '0' text:[0-7]+
    {
        var value = parseInt(text.join(''), 8);
        return { type: 'int', value: value };
    }

string_literal "string literal"
  = '"' text:strchar* '"'
    { return { type: 'string-literal', value: text.join('') }; }

character_literal "character literal"
  = "'" text:strchar "'"
    {
        return { type: 'int8', value: text.charCodeAt(0) };
    }

strchar
  = [ a-zA-Z0-9'!@#$%&*()\-+=_/\[\]{}^~,.:;?|]
  / '\\r' { return '\r'; }
  / '\\n' { return '\n'; }
  / '\\t' { return '\t'; }
  
  / '\\x' text:([0-9a-fA-F][0-9a-fA-F])
    { return String.fromCharCode(parseInt(text[0] + text[1], 16)); }

  / '\\u' text:([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F])
    {
        return String.fromCharCode(parseInt(text[0] + text[1] +
                text[2] + text[3], 16));
    }
	
  / '\\"' { return '"'; }
  / "\\'" { return "'"; }
  / '\\\\' { return '\\'; }

sp "space" = [ \r\n\t]