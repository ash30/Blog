---
title: Project Specific VSCode Setup with Nix-shell
tags: posts
date: 2022-12-01
---
<span class="firstcharacter">D</span>ependencies, dependencies, dependencies! There's no escaping the cooperative existence we 'enjoy' in our code bases today and they really deserves a better mantra than the one I've just furnished them with.

 They exist at all levels of the stack so unsurprisingly we have evolved numerous fractured sets of tools to deal with their management, twas ever the way! Some are definitely better than others, there are ecosystems infamous for the pain they have wrought upon the masses with what can be described, with the benefit of hindsight, as tooling oversight.[^dev]

[^dev]: The painful evolution of python tooling is what comes to mind for me, pipenv specifically!

That's why I personally find Nix so appealing, the promise of a more unified solution that is independent of programming language or environment. I can use nix to manage my dependencies for Android development as equally as I can a cloud native micro service, for local dev setups all the way to production boxes. Whether the full gamut of usage is a good idea? I'm still yet to fully decide - being but an apprentice of Nix as of the time of writing.

Like many who have trodden this path before though, its painfully obvious that Nix has its rough edges, more than enough to prevent truly wide scale adoption. But even so! the allure of what it promises is just so useful, I personally think its worth trying and so thats what I've done for last 6 months. I've been using it as my 'package manager' for local dev environments and its both enabled new workflows and squashed the problems of previous ones.

One example of the new possibilities is how I manage my VSCode setup. Generally I work in a poly glot environment, using many different tech stacks so my vscode accumulates lots of disparate plugins. Seeing them all present and having to enable/disable them manually is slightly nauseating so I use `nix-shell` to setup vscode specifically for each project I'm working on. The following example loads my dendron setup only when I need it.

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

So my hope is over the next 12 months I can share more snippets of how I'm working with Nix and how to disarm the hidden edge cases every day dev tasks can unwittingly spring. In all honesty, I have more I can write now but I'm still trying to embrace what I previously preached and be ok with publishing something that I don't know is 100% correct. 

And if I overcome that... maybe then my stretch goal can be to drop my use Mr Ballmer's neologisms and come up with a better slogan too. To help convert people to appreciate the true foundational importance of dependency management![^2].

[^2]: I genuinely believe dependency management within a code base is an example of broken window theory. Here I'm talking about dependencies within your own code though, how you manage the coupling between different units of code is such a basic practise, it reflects on wider thinking. 



