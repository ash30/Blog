+++
title = "Basic Freeswitch mod with Rust"
date = 2025-01-03T23:40:03Z
images = []
tags = ["rust", "voip"]
categories = []
draft = true
+++

As I said in a previous [article]({{< ref "/posts/2024/freeswitch_rust.md" >}} "freeswitch_rust.md"), it's my belief that the VOIP industry is a great fit for Rust
so I've been working on a set of safe bindings for the freeswitch api, something that would allow people to 'fearlessly' extend freeswitch... 
Its early days, but in the interest of self documentation and holding myself to account, I'm writing this article to explain my initial 
design experiments. Enough talking then, let's show you code!

##  Classic Implementation
```c
SWITCH_MODULE_LOAD_FUNCTION(mod_hello_world_load);
SWITCH_MODULE_DEFINITION(mod_hello_world, mod_hello_world_load, NULL, NULL);
SWITCH_STANDARD_API(hello_main);
#define SYNTAX ""

SWITCH_MODULE_LOAD_FUNCTION(mod_hello_world_load)
{
	*module_interface = switch_loadable_module_create_module_interface(pool, modname);
	switch_log_printf(SWITCH_CHANNEL_LOG, SWITCH_LOG_NOTICE, "mod hello_world loading");
    
    switch_api_interface_t *api;
    SWITCH_ADD_API(api, "hello", "hello", hello_main, SYNTAX);
	return SWITCH_STATUS_SUCCESS;
}

SWITCH_STANDARD_API(hello_main)
{
	switch_log_printf(SWITCH_CHANNEL_LOG, SWITCH_LOG_NOTICE, "mod hello world");
    stream->write_function(stream, "+OK Success");
	return SWITCH_STATUS_SUCCESS;
}
```

##  Initial Rust SDK
```rust
#[switch_module_define(mod_hello_world)]
struct FSModule;

impl LoadableModule for FSModule {
    fn load(module: FSModuleInterface, pool: FSModulePool) -> switch_status_t {
        debug!(channel = SWITCH_CHANNEL_ID_LOG; "mod hello_world loading");
        module.add_api(hello_main);
        switch_status_t::SWITCH_STATUS_SUCCESS
    }
}

#[switch_api_define("hello", "SYNTAX")]
fn hello_main(cmd:&str, _session:Option<Session>, mut stream:StreamHandle) -> switch_status_t {
    debug!(channel = SWITCH_CHANNEL_ID_SESSION; "mod hello world");
    let _ = writeln!(stream, "+OK Success");
    switch_status_t::SWITCH_STATUS_SUCCESS
}
```

So what have we got?

Firstly a trait matching the classic `SWITCH_MODULE_DEFINITION` macro function params.
In tandem with an attribute proc_macro `#[switch_module_define]` it can transform our struct into the correct entry point requirements for freeswitch's loadable modules. 

```rust
pub trait LoadableModule {
    fn load(module: FSModuleInterface, pool: FSModulePool) -> switch_status_t;
    fn shutdown() -> switch_status_t { switch_status_t::SWITCH_STATUS_SUCCESS }
    fn runtime() -> switch_status_t { switch_status_t::SWITCH_STATUS_TERM }
}
```

The trait provides default implementations for non used module functions, equivalent to passing Null in the classic macro's call site.
Being able to generate the extern C code helps the sdk take responsibility for the potentially unsafe C code needed.
Most of it is trivial boiler plate to be fair, but still it's nice to not worry about it.

The other design ideas are around how to map Freeswitch's concepts to idiomatic Rust and so we can provide the productivity that Rust developers would be accustomed to. 
For example: Freeswitch has the concept of writing to streams and uses it as a form of return value for API mods.

```c
   stream->write_function(stream, "+OK Success");
```
This one is a bit of a no brainer in my opinion, as stream reading and writing fit perfectly to the `std::io` Read and Write traits, a generalisation around synchronous IO. In doing so we then get the benefits of re-using the macros for ergonomic stream handling and output formatting.

```rust
    let _ = writeln!(stream, "+OK Success");
```

Another common concept we have to map is logging but this one is not so straightforward due to the customised interface freeswitch has around logging. 
Initially my thoughts were to try and ride on the shoulders of the [log](https://crates.io/crates/log) crate and implement something behind its shared interface but the question becomes how to handle all of `switch_log_printf` parameters?

```c
/*!
  \brief Write log data to the logging engine
  \param channel the log channel to write to
  \param file the current file
  \param func the current function
  \param line the current line
  \param userdata ununsed
  \param level the current log level
  \param fmt desired format
  \param ... variable args
  \note there are channel macros to supply the first 4 parameters (SWITCH_CHANNEL_LOG, SWITCH_CHANNEL_LOG_CLEAN, ...)
  \see switch_types.h
*/
SWITCH_DECLARE(void) switch_log_printf(_In_ switch_text_channel_t channel, _In_z_ const char *file,
									   _In_z_ const char *func, _In_ int line,
									   _In_opt_z_ const char *userdata, _In_ switch_log_level_t level,
									   _In_z_ _Printf_format_string_ const char *fmt, ...) PRINTF_FUNCTION(7, 8);
```
Things like `channel` and `userdata` are very bespoke and don't map nicely. My current design is to make use of arbitrary kv parameters of structured logging, but this feels a bit hacky and I have my doubts whether it will be the final solution.

## A Note on Entry Points 

The production hardened freeswitch developer might be scratching their head right now, wondering why re-implement the loadable module macros?
Experienced FreeSWITCH developers may be wondering why we’re re-implementing loadable module macros. There are two reasons for this:

1.  Because we can! In certain languages, re-inventing the FFI boundary would be arduous, not so in Rust!
    As it has a wonderful C ABI interop story. In doing so we can abstract away some of the raw pointer types required and provide a more idiomatic interface.

2.  Macros don't come across in automatic bindgen created *sys crates. So the choice is to either 
implement something or be happy with moving the C + Rust boundary down a level into the mod itself. This is what C++ mod writers 
traditionally do: have the mod's entry point be C and just interop with classes/functions within CPP. This has the benefit/blessing of 
using the official FS SDK which is obviously better in terms of long term code maintenance.

The plan is to support both ultimately.

## What's Next?

It's a starting point, but there's much more to do in order to make the rust sdk come to life. The aim is to provide safe wrappers around the key freeswitch APIs but provide a safety hatch for 
both flexibility but also because of limited time vs extensive API surface area... till next time!
