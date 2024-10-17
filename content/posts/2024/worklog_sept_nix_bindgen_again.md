+++
title = "More Rust + Nix + Bindgen "
date = 2024-10-08T23:35:09+01:00
images = []
tags = ["rust","nix"]
categories = []
+++

How to set up nix packaging for a rust project which also links against an external C lib ? Well read on... 

First credit where credit is due, I base a lot of my understanding on this excellent article: [link](https://m7.rs/blog/2022-11-01-package-a-rust-app-with-nix/index.html). The goal is to create a derivation to let nix build the rust lib but also a nix shell to let us do local development whilst sharing the same declared dependencies. I'll be using the nix setup for my freeswitch_rust project as an example.

```nix
{ pkgs ? import <nixpkgs> { 
    overlays = [ 
      (import (fetchTarball "https://github.com/oxalica/rust-overlay/archive/2e7ccf572ce0f0547d4cf4426de4482936882d0e.tar.gz"))
    ];
  } 
}:
let
  rustPlatform = pkgs.makeRustPlatform {
    rustc = pkgs.rust-bin.stable.latest.default;
    cargo = pkgs.rust-bin.stable.latest.default;
  };
in
rustPlatform.buildRustPackage rec {  
  pname = "freeswitch_rs";
  version = "0.1";
  nativeBuildInputs = with pkgs; [ 
    rustPlatform.bindgenHook
    pkgs.fs
  ] 
  cargoLock.lockFile = ./Cargo.lock;

  src = pkgs.lib.cleanSource ./.;
}
```

Firstly we're using one of the excellent overlays available to define exactly what version of the rust toolchain we want to use. Having done that - we can have a rustified mkDerivation experience using `rustPlatform.buildRustPackage`. 

Worth noting is the use of the bindgenHook to allow Bindgen's build script successfully locate the native libs provided by nix. The internet has many good articles about early experimentation on how to successfully setup nix and Bindgen plumbing but weirdly I didn't see many mentions on what I assume is the solution that emerged later on and now a bonafide nixpkg helper.

For those curious on what's happening, the open source nature of nix naturally obliges:

```nix
populateBindgenEnv () {
    export LIBCLANG_PATH=@libclang@/lib
    BINDGEN_EXTRA_CLANG_ARGS="$(< @clang@/nix-support/cc-cflags) $(< @clang@/nix-support/libc-cflags) $(< @clang@/nix-support/libcxx-cxxflags) $NIX_CFLAGS_COMPILE"
    export BINDGEN_EXTRA_CLANG_ARGS
}
```
It seems the hook will pipe our native inputs into cargo/bindgen via `BINDGEN_EXTRA_CLANG_ARGS` env var, which is the direction alot of the early experimentation hit upon. It also helps bindgen libclang by setting `LIBCLANG_PATH` - handy!

## Local development shell

The final piece is to create dev shell based on our derivation, using `inputsFrom` to copy the nativeInputs for us.

```nix
{ pkgs ? import <nixpkgs> { 
    overlays = [ 
      (import (fetchTarball "https://github.com/oxalica/rust-overlay/archive/2e7ccf572ce0f0547d4cf4426de4482936882d0e.tar.gz"))
    ];
  }
}:
pkgs.mkShell {
  inputsFrom = [ (pkgs.callPackage ./default.nix { }) ];
  buildInputs = with pkgs; [
    rust-bin.stable.latest.rust-analyzer # LSP Server
    rust-bin.stable.latest.rustfmt       # Formatter
    rust-bin.stable.latest.clippy        # Linter
  ];
}
```

## Native Libraries with headers in subfolders 

In the [Wiki](https://nixos.wiki/wiki/C) they briefly mention how to handle Libraries like freeswitch that put there headers in subfolder:

> However, while the $out/include folder will be included by default, it may sometimes not be enough when the lib puts the header in a subfolder (for instance, gtk2 and gtk3 uses subdirectories like $out/include/gtk-2.0 instead to avoid conflict between versions).
> 
> ... To deal with this kind of libraries, one can use `pkg-config`: the idea is simply to add `pkg-config` in the nativeBuildInputs, and then to start the buildPhase with:

Honestly feels abit like cheating, but in order to fix the include paths for libfreeswitch we can add the following shellhook to extend what `rustPlatform.bindgenHook` sets up for us:

```nix
  NIX_CFLAGS_COMPILE="-I${fs.out}/include/freeswitch";
  shellHook = ''
    export BINDGEN_EXTRA_CLANG_ARGS="$BINDGEN_EXTRA_CLANG_ARGS $(pkg-config --cflags freeswitch)"
  '';
```

This will fix both the building of the derivation and attempts to use it as a dev shell, although I do wonder if there's a more elegant solution...

