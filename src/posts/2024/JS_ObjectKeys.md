---
title: This one weird trick... with JS object keys
tags: [post]
date: 2024-04-25
---

I've been reading the source of https://github.com/kirm/sip.js recently, and I stumbled upon a JS idiom which I had no idea about:

```
function makeContextId(msg) {
  var via = msg.headers.via[0];
  return [via.params.branch, via.protocol, via.host, via.port, msg.headers['call-id'], msg.headers.cseq.seq];
}

// ... 
// Else where in the code 
var ctx = contexts[makeContextId(msg)];

```
REF: https://github.com/kirm/sip.js/blob/master/proxy.js

I've known for a while JS objects must be keys or symbols, I even remember a particular developer poo pooing JS for the lack of flexibility. 
Well, that contraints still holds, but it seems the bracket operators `[]` coerces the value to a string for you! 
and so the above code works, both marvellous and terrifying :) 

This is because the `toString` function of an array returns something useful:

```
let list = [1,2,3,4,5]
list.toString()
>>> '1,2,3,4,5'
```
but beware, this is not always the case...
```
let obj = { a:1 }
obj.toString()
>>> '[object Object]'
```

So go forth journeyman developer, myself included, and revel in this intersting tid bit!
