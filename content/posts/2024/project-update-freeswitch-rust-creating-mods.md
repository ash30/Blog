+++
title = "Basic Freeswitch mod with Rust"
date = 2024-11-09T23:40:03Z
images = []
tags = ["rust", "voip"]
categories = []
draft = true
+++

As I said in a previous [article]({{< ref "/posts/2024/freeswitch_rust.md" >}} "freeswitch_rust.md"), its my belief that the VOIP industry is a great fit for Rust
so I've been working on a set of safe bindings for the freeswitch api, something that would allow people to 'fearlessly' extend freeswitch... 
Its early days, but in the interest of self documentation and holding myself to account, I'm writing this article to explain my initial 
design experiments. Enough talking then, lets show you code!

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

#[switch_api_define("hello")]
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
Most of it is trivial boiler plate to be fair, but still its nice to not worry about it.


The other niceties included in the Rust API is mapping the generalist concepts of Logging and Stream writing within Freeswitch onto their standardize counter-parts within the Rust ecosystem. SDKs are about 
ergonomics which hopefully translate to productivity and so alot of the design decisions are about how best to map freeswitch C'ism onto modern Rust patterns. 

For logging the sdk adapts the internal logger to Rust's [log](https://crates.io/crates/log) interface. The main challenge here is how do we emulate how the classic Freeswitch Macros pass a load of additional metadata to the logging functions... for now I've tried to appropriate the key value functionality of structured logging, but I'm doubtful this is going to be the preferred solution.

```rust
    debug!(channel = SWITCH_CHANNEL_ID_SESSION; "mod hello world");
```

Theres a much more straight forward adaptation of freeswitch's stream writing patterns to the `std::io::Write` trait and again we then benefit from the ergonomics and end user familiarity of the `std::io` macros .

## A Note on Entry Points 

Its a little self indulgent, but I think it would be great if the whole Mod could be written in Rust. This goes counter to what usually happens for non C based mods, where atleast the initial entry point
is kept in C to benefit from the SDK API freeswitch provides to mod writers. To use rust, it means re-implementing some of it because alot of the existing API is based on macros, which
don't port across with bindgen. In future the project should probably cater for both.
