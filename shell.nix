let
  pkgs = (import <nixpkgs> { 
        config.allowUnfree = true;
  });
  extensions = (with pkgs.vscode-extensions; [ ms-python.python /* ... */ ])
	++ pkgs.vscode-utils.extensionsFromVscodeMarketplace [
	      ];
  vscode = pkgs.vscode-with-extensions.override { vscodeExtensions = extensions; };
in 
pkgs.mkShell {
    allowUnfree = true;
    name = "node";
    buildInputs = [
        pkgs.nodejs-16_x
        pkgs.jq
    ];
    nativeBuildInputs = [ 
	vscode
    ];
    shellHook = ''
        mkdir -p .nix-node
        export PATH="$PWD/.nix-node/bin:$PATH"
        npm config set prefix "$PWD/.nix-node/"
        alias code="code --user-data-dir ~/Library/Application Support/code/user/ash"
        
    '';
}
