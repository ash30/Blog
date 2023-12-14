---
title: Thoughts on Kotlin Multiplatform 
tags: [posts, public]
date: 2023-01-05
---

<span class="firstcharacter">A</span>lso known as: My year in review! I recently helped create the content for a talk[^talk] presented by my colleague Zachary Powell (@devwithzachary). It was the story of how our team migrated an existing public sdk to use KMP internally. I'm immensely proud of what we delivered and I wanted to take the time to expand on some of the points raised within the talk and figured this quiet corner of the internet offers enough space to tame the minutiae.

[^talk]: https://developer.vonage.com/blog/22/10/04/devcity-comes-to-london

The standard disclaimer first though: any article that follows a teams experience with 'X' technology is obviously biased and subjective by definition so take everything here with a healthy pinch of salt. Further: an 'experience using kotlin' is an evolving one, so to be precise - these thoughts were based on versions 1.6 to 1.7. So with all that out of the way, and in no particular order, some points I'd like to share! 

### A Modern Cross Platform Toolset 
When the sets of developers working across the different platforms is disjoint, we have a recipe for misaligned products and tacit approval for platform fiefdoms. Ensuring a similar overall architecture when working across multiple platforms is crucial for efficient future feature development. Yet, convincing mobile teams to break out of their singular platform silos remains a significant challenge. [^1]

[^1]: The tech industry generally encourages people to foster an identity coupled to a single platform and developers gleefully accept the tribalism.

Cross platform development swaps the problem of keeping disparate codebases in feature parity for the problem of additional complexity brought about by a new set of tooling and a more involved build process. There is no universal right trade here, it depends on the domain but the strength of kotlin is that it does alot to minimise the complexity required:

- The build system and project templates sets up the native code compilation and bindings automatically for you.
- Theres an ecosystem of cross platform libs you can use.
- Half your team already knows kotlin!

We can compare this against the standard way of doing xplat which is introducing C++ or C components and you can see there is noticeably less additional tooling and knowledge required. Lowering this upfront cost is what makes Kotlin such an strong prospect.

### Keeping KMP Internal 
The API boundary of a library is a contract between you and the outside world. To 'delegate' this indirectly to the cross platform translation of the kotlin compiler feels like a leap too far... for now at least. This is a point that hit us particluarly hard since we are shipping API's for other developers to consume.

We ended up doing a thin wrapper layer on top of any common code we exposed publicly which provides more stability to the interface (ie. no chance that a kotlin compiler change would affect the external api) at the expense of increased platform specfiic code. This is definitely a trade off but one which is minimised if following good api practisies like minimal surface area. And you do retain some of the benefits of code sharing - because busines logic remains shared and platform specific code is reduced to type system boiler plate in 99% of cases.


<!-- The translation of data types and signatures is functional but a little rough around the edges. Additionally, with KMP being slightly experimental still, it seems the best short term plan was to allow KMP to dictate our public API within the iOS code base.

In affect, iOS code base is one bigger type translating, signature massarging wrapper for the functionality defined within the shared KMP module. 

This is both a good and bad thing. 

Its not a very sustainable practise: (manually) wrapping all the generated types and signatures within the ios codebase. But it does remove the :

In our case, for now we have got away with manual wrappers because we don't have to much api surface area exposed. There will be a point in future we this become unsustainable and we will either have to look at auto generating the wrappers ( KSP potentially? ) or hope KMP has solidified enough to be apart of the public API :crossed_fingers: ... -->

<!-- 
## Cautious and Incremental Adoption


## Memory Model                                    -->
