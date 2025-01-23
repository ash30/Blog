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

# Dispatcher and the Dispatch trait

The `Dispatcher` is the lowest layer which implements `Future` trait, its implementation drives foward the "IO Loop" defined within `poll_loop` method. Generally all IO related code will have some form of looping control flow that orchestrates the reads and writes to an IO abstraction, and this is where it happens in Hyper.

```rust
    fn poll_loop(&mut self, cx: &mut Context<'_>) -> Poll<crate::Result<()>> {
        // Limit the looping on this connection, in case it is ready far too
        // often, so that other futures don't starve.
        //
        // 16 was chosen arbitrarily, as that is number of pipelined requests
        // benchmarks often use. Perhaps it should be a config option instead.
        for _ in 0..16 {
            let _ = self.poll_read(cx)?;
            let _ = self.poll_write(cx)?;
            let _ = self.poll_flush(cx)?;
            if !self.conn.wants_read_again() {
                return Poll::Ready(Ok(()));
            }
        }
        task::yield_now(cx).map(|never| match never {})
    }
```

The dispatcher logic is common between server and client, but it needs a way to adapt how it integrates with the upper public layers because obviously the API for servers and clients are different. This is where the `Dispatch` trait comes in. The module defines another pair of `Server` and `Client` structs which in turn define their own implementations of Dispatch. Unlike what we saw with the `Role` enums and the `HTTP1Transaction` trait, Dispatch trait takes a mutable self receiver and so is a slightly more involved relationship with its calling code. 

In the client implementation of `poll_msg` is where we see the ingestion of requests from calling code which is done via a `ClientRx` type, a wrapper of a channel's RX handle with additional logic around cancellation. The usage of the channel helps decouple ownership of the `Dispatcher` and the calling code who wants to send http requests - something we'll see shortly in the public API.

Also note, the `cb` paramter received via the receiver is a form of callback modelled over a oneshot channel, allowing the dispatcher to pass back the http response.

```rust
    impl<B> Dispatch for Client<B>
    where
        B: Body,
    {
        fn poll_msg(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Option<Result<(Self::PollItem, Self::PollBody), Infallible>>> {

            let mut this = self.as_mut();
            match this.rx.poll_recv(cx) {
                Poll::Ready(Some((req, mut cb))) => {
                    // check that future hasn't been canceled already
                    match cb.poll_canceled(cx) {
                        Poll::Ready(()) => {
                            trace!("request canceled");
                            Poll::Ready(None)
                        }
                        Poll::Pending => {
                            let (parts, body) = req.into_parts();
                            let head = RequestHead {
                                version: parts.version,
                                subject: crate::proto::RequestLine(parts.method, parts.uri),
                                headers: parts.headers,
                                extensions: parts.extensions,
                            };
                            this.callback = Some(cb);
                            Poll::Ready(Some(Ok((head, body))))
                        }
                    }
                }
                // ...
            }
        }

```

# The Public API: RequestSender + Connection 

The 1.0 roadmap [doc](https://github.com/hyperium/hyper/blob/master/docs/ROADMAP.md) shines a really good light into the thought process around the current public API for Hyper. Ultimately the need for flexiblity and long term stability meant the original authors eschewed any ergonomic designs that would hinder those goals longterm and so ended up pairing back to the API. Having said that, the final 1.0 API is still relatively straight forward.

```rust
    // Create the Hyper client
    let (mut sender, conn) = hyper::client::conn::http1::handshake(io).await?;

    // Spawn a task to poll the connection, driving the HTTP state
    tokio::task::spawn(async move {
        if let Err(err) = conn.await {
            println!("Connection failed: {:?}", err);
        }
    });
    // ...
    let mut res = sender.send_request(req).await?
```

A full guide of the public API can be found [here](https://hyper.rs/guides/1/client/basic/)


# Wrapping up

Its feels slightly awkward to end this journey here, there's still so many interesting facets to the library worth exploring, from the request modelling to http specific details like handling body streaming or upgrades. Something for future articles... which hopefully can also include comparision to other HTTP libs. I remember reading the folllowing when Cloudflare's Pingora was [annouced](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/)

> Although there are some great off-the-shelf 3rd party HTTP libraries, such as hyper, we chose to build our own because we want to maximize the flexibility in how we handle HTTP traffic and to make sure we can innovate at our own pace.

Although dissappointing from a ecosystem fragmentation POV, alternative implementations are always welcome and offer the chance to compare and contrast design decisions. 


