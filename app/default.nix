{ route ? "/" }:
let
  getContent = import ./get.nix {};
in rec {
  get = getContent route;
}
