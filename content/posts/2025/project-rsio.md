+++
title = "New Project: HTTP Longpoll"
date = 2025-03-19T21:29:35Z
images = []
tags = ['rust']
categories = []
draft = true
+++

Its 2025 and I'm telling you how my new project is about implementing http longpoll? You might think I'm mad... but hear me out.

My latest side project started life as a wish to port some of the benefits of the now venerable libray 'SocketIO' over to rust.

Websockets are great but they are only the transport layer, you need a bit more functionality in order to provide reliable end to end 
communication, something that socketio did with relative success.

But when working though the idea of how to port ideas over, both because of lack of man power and philosophical mismatch between
JS and rust, the question quickly became 'what SUBSET' of functionality is relevant and on the TODO list? In the end, it actually
became a question of which 'layer' of the protocl do we want to carry over, because SocketIO, like all things networking, was a layered abstraction.

The lower layer implementation was the 'engine' and provided:
- transport independance and upgrade
- heartbeat 

I've always considered one of the strengths of Rust's ecosystem to be its drive for modular and lowlevel libraries, leaving the opinionated code 
to the application developer. In that light, focusing on the engineio layer was a natural direction to take
and more interestiing for purpose of side project zen.

And so I found myself writing a small modualr http longpoll library, decoupled from any notion of the original engineio origins,
with the long term plan of having it power some of the functionality in small lightweigth crate.



WHAT
WHY
EXAMPLE 
WHAT NEXT 










