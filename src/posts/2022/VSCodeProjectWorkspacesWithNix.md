---
title: Project Specific VSCode Setup with Nix-shell
tags: [posts, public]
date: 2022-12-01
---

<span class="firstcharacter">D</span>ependencies, dependencies, dependencies! The inescapable reality of our code bases today is that of a collaborative existence.

Since the concept of sharing code spans every layer of the stack, it's not unsurprising that we've created a diverse and disjointed set of tools to handle them. My poison of choice ? Nix ! Because it holds the promise of a unified solution to dependency hell.

I can use nix to manage my dependencies for Android development as equally as I can a cloud native micro service, for local dev setups all the way to production boxes. Whether the full gamut of usage is a good idea? I'm still yet to fully decide - being but an apprentice of Nix as of the time of writing.

One example of the power of nix is how I can manage my VSCode setup. Generally I work in a poly glot environment, using many different tech stacks so vscode accumulates lots of disparate plugins. Seeing them all present and having to enable/disable them manually is slightly nauseating so I use `nix-shell` to setup vscode specifically for each project I'm working on. The following example loads my dendron setup only when I need it.

```js
let
  pkgs = (import <nixpkgs> {
        config.allowUnfree = true;
  });
  extensions = (with pkgs.vscode-extensions; [ ms-python.python /* ... */ ])
	++ pkgs.vscode-utils.extensionsFromVscodeMarketplace [
		{
		  name = "dendron";
		  publisher = "dendron";
		  version = "0.103.0";
		  sha256 = "pJ3aZ5Yh/pIBWiHHs1V4JxdYxK+f17xRvPR+DXfHgVM=";
		}
		{
		  name = "dendron-markdown-preview-enhanced";
		  publisher = "dendron";
		  version = "0.10.57";
		  sha256 = "sha256-uJmdsC+nKCkAJVH+szNepPcyfHD4ZQ83on195jjqZig=";
		}
    ];
  vscode = pkgs.vscode-with-extensions.override { vscodeExtensions = extensions; };
in
pkgs.mkShell {
    allowUnfree = true;
    name = "node";
    buildInputs = [
        pkgs.nodejs-16_x
    ];
    nativeBuildInputs = [
	    vscode
    ];
    shellHook = ''
        alias code="code --user-data-dir ~/Library/Application Support/code/user/PROJECT_NAME"
    '';
}
```

Dendron is actually a really good example of something I don't want enabled all the time. The extension's recommended usage mandates the installation of other extension and takes over previewing certain content types. And even if Vscode was to come out tomorrow with an amazing new UI to manage extensions, its doesn't matter, Nix offers a universal set of tools to manage this which allows me to stop having to relearn the wheel in every different part of the stack.



