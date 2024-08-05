let pkgs = import (builtins.fetchTarball {
  # Descriptive name to make the store path easier to identify
  name = "nixpkgs-unstable";
  # commit hash for 23.05
  url = "https://github.com/nixos/nixpkgs/archive/68c9ed8bbed9dfce253cc91560bf9043297ef2fe.tar.gz";
  # Hash obtained using `nix-prefetch-url --unpack <url>`
  sha256 = "1zwwji3nhn9zdmck2bllqjbswsr7r30q8fbggw8y1j2ymsvz29jg";
}) { localSystem = "aarch64-darwin"; };
#parentShell = import ./base.nix;

in
pkgs.mkShell rec {
  nativeBuildInputs = [
    pkgs.hugo
  ];


}
