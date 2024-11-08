+++
title = "Understanding Hyper HTTP Clients (Part 2)"
date = 2024-11-08T10:24:53Z
images = []
categories = []
tags = ["rust","code walk"]
draft = true
+++

In the first [part]({{< ref "/posts/2024/code_walk_hyper_part1/" >}} "Part 1") of our code walkthrough for [Hyper](https://hyper.rs/), we started walking up the layers of the different modules, seeing the low level `Conn` and the supporting `Buffered` and `Role` entities which form a complete api for sending and receiving the different parts of the http protocol over a generic IO object. Today we'll continue the 'summit' of the code base: the public api and see how these subsystems are exposed in an ergonomic and flexible way to the public API.

# Overview

The next steps on our journey!
```
------------ Public API ------------------
┌────────────┐┌──────────────┐
│Client::Conn││Client::Sender│
└┬───────────┘└──────────────┘
-┬--------- Private API ------------------
 |
┌▽─────────────┐              
│Dispatcher    │ // Resuming here!
└┬────────────┬┘              
┌▽──────────┐┌▽───────┐       
│Conn       ││Dispatch│       
└┬─────────┬┘└────────┘       
┌▽───────┐┌▽───┐              
│Buffered││Role│              
└────────┘└────┘              

```

