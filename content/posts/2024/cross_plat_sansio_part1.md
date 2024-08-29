+++
title = "Cross Platform SANSIO - Part 1"
date = 2024-07-28T09:37:44+01:00
images = []
tags = ["sansio"]
categories = []
draft = false
+++
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
</script>

I really believe in cross platform... BUT! I would be the first person to say "not all code is worth sharing", you have to pick your battles. Generally platform specific functionality is a pain to share because you end up being tasked with trying to wrap an API in a generalised abstraction that you hope will both hide platform complexity away but still be flexibile enough to accomodate. Practically speaking - its best to lean on existing libraries or frameworks here which is why things like Kotlin Multi Platform are popular, they've done alot of the heavy lifting already.

There is an alternative strategy to architecting shared platform code, atleast thats what I'm going to try and present in this series of blog posts. Sometimes the best solution to a problem is to avoid it all together, so instead of wrapping platform code, we're going to leave the platform code do all the actual platform specific api calls, madness! In tandem, we're going to make our shared library 100% decoupled - no platform api call insight! Instead the shared code will return values that the platform can intepret to figure out what todo, a set of instructions so to speak.

This idea borrows heavily from an existing concept called *SANSIO* - decoupling application protocols from the actual platform's socket api, which was originally motivated by the need to avoid the 'function coloring' problem in languages with distinct sync and async function semantics. As you may have guessed from the title of this series, I'm going to slightly relicense the terminology in the context of cross platform code because genuinely think its a good conceptual fit for what we're aiming for.


## Architectural Differences 

Our SANSIO implementation will be interesting because it will be an inversion of the usual approach to abstraction. Here we have the example of making a network request in our shared code library.

### Traditional Approach 
<pre class="mermaid">

sequenceDiagram
    participant Platform
    participant Shared
    participant IO

    Platform ->> Shared: SendRequest() 
    Note left of Platform: Coupled IO   

    Shared ->> Platform: Send()
    Platform ->> IO: Send() (impl)

</pre>

### SANSIO Approach
<pre class="mermaid">
sequenceDiagram
    participant Platform
    participant Shared
    participant IO

    Platform ->> Shared: SendRequest() 
    
    Note left of Platform: Decoupled IO   

    rect rgb(191, 223, 255)
    Platform ->> Shared: PollOutput() 
    Shared -->> Platform: item
    Platform ->> IO: Send() 
    end
</pre>

Traditionally the shared code would be aware of the platform specific APIs ( in our case the socket ) and directly call it. Normally this functionality would be wrapped behind an common interface so thats we could generalise the shared code. We can say there is a 'slight' coupling between shared code and host platform IO - not strong because we've been good and abstracted it away behind an interface but the degree of flexibility and 'looseness' will depend on how good or leaky this shared IO abstraction is.

The same method call is broken down into two distinct phases in the SANSIO Implementation. The `sendRequest()` calls our shared domain model and receives validation via normal return values. In a seperate method call, the host platform checks if it needs todo any io, this useful because:

- the io 'side effect' is generalised across any method call into the shared code.
- the io implementation is completely decoupled from domain logic 
- No need to abstract over disparate platform APIs but the trade off is slightly more platform specific code.

These are useful qualities to have and will mean our shared code is easier to implement and test than traditional approaches... but at what cost I hear you say? Well in part 2 of this article, we will explore a concrete example I’ve been working on — cross-platform network session handling - and see how Sans-IO applies and what that means in terms of actual code.

