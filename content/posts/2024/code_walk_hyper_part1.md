+++
title = "Understanding Hyper HTTP Clients (Part 1)"
date = 2024-11-07T20:41:47Z
images = []
tags = ["rust","code walk"]
categories = []
+++

One of the under appreciated joys of open source is the ability to study someone else's system design, to learn directly from working code. Today I wanted to try a new type of article, a walkthrough of interesting Rust codebases, starting with [Hyper](https://hyper.rs/), a low level HTTP library.

Let's build our understanding of Hyper from the bottom up, walking through some of the 'leaf' modules and see how they fit into the call flow of a typical HTTP1 request response.

# Overview
The journey a head!
```
------------ Public API ------------------
┌────────────┐┌──────────────┐
│Client::Conn││Client::Sender│
└┬───────────┘└──────────────┘
-┬--------- Private API ------------------
 |
┌▽─────────────┐              
│Dispatcher    │ 
└┬────────────┬┘              
┌▽──────────┐┌▽───────┐       
│Conn       ││Dispatch│       
└┬─────────┬┘└────────┘       
┌▽───────┐┌▽───┐              
│Buffered││Role│ // Starting HERE!
└────────┘└────┘              

```



# Roles

Hyper defines x2 roles: `Client` and `Server`, which is an idea defined by the RFC as a specific type of participant within the HTTP dialogue.

```rust
#[cfg(feature = "client")]
pub(crate) enum Client {}

#[cfg(feature = "client")]
impl Http1Transaction for Client {
    //....
}

#[cfg(feature = "server")]
pub(crate) enum Server {}

#[cfg(feature = "server")]
impl Http1Transaction for Server{
    //....
}
```

More practically we can see the module defines two entities which implement the `Http1Transaction` trait. The trait is a series of 'static' methods i.e. no `self` receiver which specialise decision making depending on the participants role, with the trait's default method implementation illustrating this quite nicely.

```rust
pub(crate) trait Http1Transaction {
    // ... 
    fn should_error_on_parse_eof() -> bool {
        Self::is_client()
    }

    fn should_read_first() -> bool {
        Self::is_server()
    }
}
```
The roles are used to fork behaviour in HTTP related functions based on participants. Remember there's no inheritance in rust, so this is one way code can implement specialising behaviours.

```rust
// called by connections handling code for both client and server
pub(super) fn parse_headers<T>(
    bytes: &mut BytesMut,
    prev_len: Option<usize>,
    ctx: ParseContext<'_>,
) -> ParseResult<T::Incoming>
where
    T: Http1Transaction,
{
    //....
    T::parse(bytes, ctx)
}
```

# Buffered 
An internal struct which wraps a generic IO object and provides a polling interface for reading and writing HTTP messages with the help of some internal buffers.

The parse method is the equivalent of 'socket.read()' + parsing. It aims to accumulate enough bytes into the read buffer so it can parse the HTTP message, returning Poll:Ready when it's finally got enough bytes to decipher the message.
It also branches parsing logic based on role as we previously discussed.
```rust
impl<T, B> Buffered<T, B>
where
    T: Read + Write + Unpin,
    B: Buf,
{
    // parse() reads IO and creates http messages out of buffer content
    fn parse<S>(
        &mut self,
        cx: &mut Context<'_>,
        parse_ctx: ParseContext<'_>,
    ) -> Poll<crate::Result<ParsedMessage<S::Incoming>>>
    where
        S: Http1Transaction,
    {
        // ...
    }

    // ...
```

Writing to the socket is accomplished via crate public getter method for a write buffer and an accompanying flush method that moves bytes over to the generic IO object via its async_write interface and ultimately calls flush(). Similar to parse, the methods return `std::Task` so it plays nice with non blocking async.

```rust
    pub(super) fn write_buf(&mut self) -> &mut WriteBuf<B> {
        &mut self.write_buf
    }

    pub(crate) fn poll_flush(&mut self, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        // ...
    }

```

# Conn(ection)
The connection struct is composed of / builds upon the `Role` object ( type T) and the HTTP based buffer `Buffered` and a new entity `State`.

```rust
pub(crate) struct Conn<I, B, T> {
    io: Buffered<I, EncodedBuf<B>>,
    state: State,
    _marker: PhantomData<fn(T)>,
}
```
The `State` struct is file private and is a practical home for the possible state space of a HTTP connection. The connection uses the state struct to track the state of `Buffered` and expose a series of boolean returning 'check' methods using the common 'is' or 'can' prefixes. 


```rust
    pub(crate) fn is_read_closed(&self) -> bool {
        self.state.is_read_closed()
    }

    pub(crate) fn is_write_closed(&self) -> bool {
        self.state.is_write_closed()
    }

    pub(crate) fn can_read_head(&self) -> bool {
        // ...
        !matches!(self.state.writing, Writing::Init)
    }
```
The Connection module builds upon `Buffered` IO and introduces reading and writing methods more aligned with the full life cycle of a HTTP request: reading bodies, reading with keepalive in mind etc.

```rust
    pub(super) fn poll_read_head(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Option<crate::Result<(MessageHead<T::Incoming>, DecodedLength, Wants)>>> {
        // ...
    }

    pub(crate) fn poll_read_body(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Option<io::Result<Frame<Bytes>>>> {
        // ...
    }

    pub(crate) fn poll_read_keep_alive(&mut self, cx: &mut Context<'_>) -> Poll<crate::Result<()>> {
        // ...
    }

```
We can see the `Conn` API endeavours to provide the low level building blocks for interacting with a HTTP based connection but leaves the management of lifecycles to its the upper layers in the stack, a simplified callsite might look like:

```rust
    // Client Send HTTP request example
    if !conn.can_write_head() { return }
    conn.write_head(head, body_type)?;
    if !conn.can_write_body() { return }
    conn.write_body(data)?;
    conn.end_body()?
    conn.poll_flush(cx)
```
The questions remaining for the upper layers is to how best orchestrate reads and writes for scale AND how to best expose our http connection to the external api users? Not surprisingly we start seeing the `Future` trait implemented, which gives calling code an ergonomic way to work with async IO and lays the foundation for an idiomatic public interface. 

----

So we've made it! About half way up the stack, still to discover the main IO loop and how this all ties back to the public API - but don't fret, all of which is to come in part 2. 
The idea of this article is kinda experimental, I have no idea if other people enjoy delving into other code bases and deciphering them, so please message me via socials if this has been of interest.
<br>
<br>
