#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

docker run \
    -p 4317:4317 \
    -p 4318:4318 \
    --net=host \
    -v "$SCRIPT_DIR/config.yaml:/etc/otelcol-contrib/config.yaml" \
    otel/opentelemetry-collector-contrib:0.103.1
