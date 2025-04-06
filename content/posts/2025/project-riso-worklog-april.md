+++
title = "Http-longpoll March Worklog"
date = 2025-04-06T21:29:35Z
images = []
tags = ['rust']
categories = []
draft = true
+++


Recap: 
- I working on a small library meant to bring the option of http longpoll to axum.
- Why? as a graceful fallback when websockets aren't possible. 

A short sumamry of what I implemented recently

- Refactored the core stream to be tokio independent 
    - generic over Body type for both Request and Response

- Could remove tokio as a dependency 
    - not sure its worth the hassle, but it would be good practise 

- the session message type is a generic, any type that implements custom into and from traits
    - The use case is to allow axum uses to use existing extractors and 'into_response' impls 
    - but blanket support for sink interface doesn't make sense
    - hence need for explicit trait impl 
    - does 

Whats next? 

- finalise testing
- start work on the 'eio' crate 
