+++
title = 'Rust + Nix Notes'
date = 2024-08-12T23:31:51+01:00
tags = ["rust", "nix"]
+++

Some nix + rust related notes after a weekend hacking around with bindgen,
they might be helpful for the next person who wanders down this road.

##  Bindgen Dependency Linking

I'm continually impressed with the amount of documentation the rust eco-system maintains in order to help onboard 
new developers and bindgen is no exception. Following the [book](https://github.com/rust-lang/rust-bindgen/blob/main/book)
you'll walk through a set of quick start tutorials and eventually setup a `build.rs` file.

Notice at the top build script you have to specify a search path for the library you wish to link against.

```rust
fn main() {
    // Tell cargo to look for shared libraries in the specified directory
    println!("cargo:rustc-link-search=/path/to/lib");

    //.... 
```

How will this work on nix then? Well some kind soul has worked it out for us [already](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/rust/bindgen/default.nix).
Bindgen has been wrapped so it injects the needed search paths for us:

```sh
exec -a "$0" @unwrapped@/bin/bindgen "$@" $sep $cxxflags @cincludes@ $NIX_CFLAGS_COMPILE
```
ref: https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/rust/bindgen/wrapper.sh

Bindgen accepts arbitrary arguments that will be forwarded directly to the compiler, so the wrapper passes `NIX_CFLAGS_COMPILE`
which should have all the include paths for any dependencies within this nix build or shell. Hurradependantdependant  h!

## Rust Package Src Changes

I wanted to use the latest master of bindgen to test the new macro generation [changes](https://github.com/rust-lang/rust-bindgen/pull/2779) but 
how does one override the src of a rust package?

For any normal package, you can just use the derivation's `overrideAttrs` to change the src attr but for rust packages there's
an implicit 2nd step: updating the cargo hash! 
When you change the src, you may also be changing the dependent crates so the build-rust-package derivation will rightfully complain.

You will have to 'backwards engineer' the hash via `cargoDeps` attr that the derivation exposes:

```nix
final: prev: {
  rust-bindgen-unwrapped = prev.rust-bindgen-unwrapped.overrideAttrs rec { 
    version = "main";
    src = prev.fetchFromGitHub {
      owner  = "rust-lang";
      repo   = "rust-bindgen";
      rev    = "66b65517b5568e122e9ce5902dd4868aa2b43d25";
      sha256 = "sha256-aXF6nR3DpeH3o05uyhaa3s8fJF6JUGs/J9bvQz0LGSs=";
    };
    cargoDeps = prev.rustPlatform.fetchCargoTarball({ 
      inherit src; 
      hash = "sha256-Pqnx+9Oa9ypRQDdhwIQ8XlPm8WAeg4CvEr7/sFyMWCI=";
    });
  };
}
```
