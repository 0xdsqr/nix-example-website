{
  description = "🟪 Bun Web App with Nix";
  
  inputs = {
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixpkgs-stable.url = "github:NixOS/nixpkgs/release-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };
  
  outputs = { self, nixpkgs-unstable, nixpkgs-stable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs-unstable = import nixpkgs-unstable { inherit system; };
        pkgs-stable = import nixpkgs-stable { inherit system; };
        
        # Define app name
        appName = "nix-example-website";
        
        # Build the Bun app
        bunApp = pkgs-unstable.stdenv.mkDerivation {
          name = appName;
          src = ./.;
          
          buildInputs = with pkgs-unstable; [
            bun
            nodejs_22
          ];
          
          buildPhase = ''
            export HOME=$(mktemp -d)
            mkdir -p $out/bin $out/app
            
            # Copy all app files to the output directory
            cp -r $src/* $out/app/
            cp -r $src/.* $out/app/ 2>/dev/null || true
            
            # Create wrapper script
            cat > $out/bin/${appName} << EOF
            #!/bin/sh
            cd $out/app
            exec ${pkgs-unstable.bun}/bin/bun run src/index.ts "\$@"
            EOF
            
            chmod +x $out/bin/${appName}
          '';
          
          installPhase = "true"; # Already handled in buildPhase
        };
      in {
        # Development shell with Bun
        devShells.default = pkgs-unstable.mkShell {
          buildInputs = with pkgs-unstable; [
            bun
            nodejs_22
          ];
          
          shellHook = ''
            echo "🟪 Bun development environment ready"
          '';
        };
        
        # Build the application
        packages.default = bunApp;
        
        # Build a container image
        packages.container = pkgs-unstable.dockerTools.buildLayeredImage {
          name = appName;
          tag = "latest";
          
          contents = [
            bunApp
            pkgs-unstable.busybox
            pkgs-unstable.nix  # Add Nix to the container
          ];
          
          config = {
            Cmd = [ "${appName}" ];
            ExposedPorts = {
              "3001/tcp" = {};
            };
          };
        };
      });
}
