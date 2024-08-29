+++
title = "Freeswitch + Rust"
date = 2024-08-29T23:23:33+01:00
images = []
tags = ["rust", "voip"]
categories = []
+++

On the face of it, the voip industry is a perfect candidate for rust: many of the flagship open source projects in the space are venerable C codebases which could benefit from rust's safety improvements -
I've seen first hand malicious actors crafting payloads to attack unpatched pointer errors.

Its 2024 and sadly adoption isn't forthcoming, with much of the industry battling ROI tensions in the post covid lockdown world. So my current project is very much a case of me 'being the change you want to see'.

Freeswitch is a celebrated open source media switch written in C and I've had the itch to try my hand at safe FFI abstractions with rust hence the birth of my new project [Freeswitch_Rust](https://github.com/ash30/freeswitch_rust). For the unfamiliar - one of the great benefits of Freeswitch is it's extensibility, with developers writing 'mods' to add functionality to the media servers so the obvious goal for the project is: can we allow mod authoring in safe idiomatic rust code.

Well it's early days, so for now I will just let the code 'do the talking', but I'm excited how far this experiment can go.

```rust
fn api_start(uuid:String, url:String) -> Result<(),Error> {
    // We can locate session and have RAII guard unlock for us when scope finishes
    let s = Session::locate(&uuid).ok_or(Error::InvalidArguments)?;

    // We can allocate arbitrary mod data types to session memory pool
    // we ensure safety by forcing deref of handle to only happen in presence of parent object
    let data = Private { foo : 1};
    let handle = s.insert(data).map_err(|_|Error::InvalidArguments)?;

    let (tx,rx) = tokio::sync::mpsc::unbounded_channel();
    let runtime = RT.get().ok_or(Error::RuntimeInit)?;
    runtime.spawn(async move {
        // Setup WS 
        loop {
            let Some(frame) = rx.recv().await else { break };
            // TODO
        }
    });

    // Closures with captured state simplifies user data retrieval
    // Bug Callback will run on session thread/different thread, so we make closure bound 'Send
    let bug = s.add_media_bug("media bug", "test", 0, move |bug, abc_type| { 
        let mut s = bug.get_session();
        let mut d = s.get_mut(&handle).unwrap();
        d.as_mut().foo = 2;

        match abc_type {
            switch_abc_type_t::SWITCH_ABC_TYPE_INIT => {}
            _ => {}
        };
    });
    Ok(())
}
```
