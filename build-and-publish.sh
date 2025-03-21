#!/usr/bin/env nix-shell
#! nix-shell -p docker -i bash

set -e

nix build .#container

docker load < result

docker tag nix-example-website:latest dennda/nix-example-website:latest
docker push dennda/nix-example-website:latest

echo "Build and push completed successfully!"
