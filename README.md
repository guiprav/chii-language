Warning: This project is *not* actively under development. It's just here so I don't forget the ideas I had for it.

* * *

Chew - A Chii Language compiler written in JavaScript
--------------------------------------------------------

'Chew' is a prototype compiler for a language that will never come to be: [Chii][chiihp].

[chiihp]: http://n2liquid.wordpress.com/category/chii-language/

Try it out
----------

You need Node and a LLVM assembly compiler + GCC, or an LLVM assembly interpreter.

To JIT-run helloworld.chii, simply do:

$ node chew.js -d helloworld.chii | lli

And, to compile it and run, do:

$ node chew.js -d helloworld.chii | llc | gcc -o helloworld -x assembler -

$ ./helloworld
