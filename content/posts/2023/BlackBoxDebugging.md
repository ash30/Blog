+++
title = "Black Box Debugging iOS Binaries"
date = 2023-09-18T09:37:44+01:00
images = []
tags = ["ios"]
categories = []
draft = false
+++

Like many other companies in the space, Vonage relies on libwebrtc in it's client-facing voice SDK. Just as I was going to take some leave, we had a peculiar issue pop up when we tried what we thought was a routine upgrade... our SDK was now causing App store uploads to fail! 

Ah, the joys of iOS development! For the uninitiated, getting your app onto the App Store involves navigating a series of infamous checks. One of the hurdles is a series of static analysis apple subjects your binary to once its been uploaded. Usually, Apple is on the ball, catching issues during compile time or, worst case, somewhere in the debug cycle. But sometimes, the checks come post-build. They are there to ensure system resources aren't abused in weird and wonderful ways. Unfortunately if you rely on 3rd party code like libwebrtc, you're on the hook if any of their code triggers a failure and you'll need to figure out what's changed.

Well here's the trick: System APIs are dynamically linked on iOS[^1] so you can do a pretty good quick and dirty audit by viewing the unresolved symbols left in the app binary. Unzip the ipa and fire up the `nm` tool and you'll get output like the following.

[^1]: I assume its the case on most platforms...?

```
>> nm app
 U _$s5UIKit17UIApplicationMainys5Int32VAD_SpySpys4Int8VGGSgSSSgAJtF
 U _$sBOWV
 U _$sSS10FoundationE19_bridgeToObjectiveCSo8NSStringCyF
 U _$sSS10FoundationE36_unconditionallyBridgeFromObjectiveCySSSo8NSStringCSgFZ
 U _$ss11CommandLineO10unsafeArgvSpySpys4Int8VGSgGvgZ
 U _$ss11CommandLineO4argcs5Int32VvgZ
 U _AVAudioSessionCategoryPlayAndRecord
 U _AVAudioSessionInterruptionNotification
 U _AVAudioSessionInterruptionOptionKey
 U _AVAudioSessionInterruptionTypeKey
 U _AVAudioSessionMediaServicesWereLostNotification
 U _AVAudioSessionMediaServicesWereResetNotification
 U _AVAudioSessionModeDefault
 U _AVAudioSessionModeVoiceChat
 ... 
```

God Bless Objective C's non mangled symbols, they make reading through and matching api usage pretty trivial. In the end I was able to simply diff the output for different versions of the SDK and find the offending the symbol. Then it was a case of finding its usage within libwebrtc and working out an internal patch to ifdef it out when required.

Phew! All in a days work (quite literally!)

