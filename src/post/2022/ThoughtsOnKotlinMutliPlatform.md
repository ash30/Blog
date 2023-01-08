---
title: Thoughts on Kotlin Multiplatform (Draft)
tags: posts
date: 2023-01-05
---

<span class="firstcharacter">A</span>lso known as: My year in review! I recently helped create the content for a talk[^talk] presented by my colleague Zachary Powell (@devwithzachary). It was the story of how our team migrated an existing client sdk to use KMP internally. I'm immensely proud of what we delivered and I wanted to take the time to expand on some of the points raised within the talk and figured this quiet corner of the internet offers enough space to tame the minutiae.

[^talk]: https://developer.vonage.com/blog/22/10/04/devcity-comes-to-london

The standard disclaimer first though: any article that follows a teams experience with 'X' technology is obviously biased and subjective by definition so take everything here with a healthy pinch of salt. Further: an 'experience using kotlin' is an evolving one, so to be precise - these thoughts were based on versions 1.6 to 1.7. So with all that out of the way, and in no particular order, some points I thought deserved expanding.

## Embracing the 'Other' Side
<!-- Receptiveness to KMP definitely falls into two obvious camps: developers who work predominantly on Android [^dev] think KMP is an excellent idea, or atleast a worth while experiment. For developers who spend most of their time in XCode, there is an immediate skepticism when being forced embrace this new technology.

To successfully introduce KMP into any project, its ultimately about alleviating the fears around the impact it will have on the iOS code base. 



KMP allows developer to take ownership of the 'mobile' experience, not just silo them selves to one platform and embracing this new found responsibility is key to enabling KMP to flourish. The idea is to not relegate one platform to an after though.

But what does this practically mean?


 Development has to take into account both platforms and this generally means compromise. Not all  
 -->




[^dev]: A deliberate choice of wording, I hate the expression 'Android Developers' and 'iOS Developers'. It reinforces a false dichotomy between platforms which IMHO helps breed insular mobile developers.




## MonoRepo
<!-- One of the natural/obvious consequences of shared code is that the simpliest change to the public api WILL break depedant code across all platforms unless you update the call site.


When you work across platforms instead of silo'd - you need feedback on your changes across both platforms no matter how trivial the change. 

Multi module gradle projects allow the compiler to catch api changes for 'down stream' modules but by default there is no equivalent for the iOS part of the project. 

The obvious 



It seems an obvious choice for KMP projects to go down the route of monorepo. Since the KMP library will be shared between the two platforms, there's an obvious advantage.
 -->

## Keeping KMP Internal 

<!-- The translation of data types and signatures is functional but a little rough around the edges. Additionally, with KMP being slightly experimental still, it seems the best short term plan was to allow KMP to dictate our public API within the iOS code base.

In affect, iOS code base is one bigger type translating, signature massarging wrapper for the functionality defined within the shared KMP module. 

This is both a good and bad thing. 

Its not a very sustainable practise: (manually) wrapping all the generated types and signatures within the ios codebase. But it does remove the :

In our case, for now we have got away with manual wrappers because we don't have to much api surface area exposed. There will be a point in future we this become unsustainable and we will either have to look at auto generating the wrappers ( KSP potentially? ) or hope KMP has solidified enough to be apart of the public API :crossed_fingers: ... -->


## Cautious and Incremental Adoption


## Memory Model                                   