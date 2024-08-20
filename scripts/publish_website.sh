#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

error_handler() {
	echo "Error occurred in line $1"
	exit 1
}

trap 'error_handler $LINENO' ERR

if ! command -v aws &>/dev/null; then
	echo "Error: AWS CLI is not installed or not in PATH. Please install AWS CLI and try again." >&2
	exit 1
fi

PUBLISH_DIR="${1:-www/dist}"

if [ -z "${FIBERPLANE_COM_BUCKET_ID:-}" ] || [ -z "${FIBERPLANE_COM_CLOUDFRONT_ID:-}" ]; then
	echo "Error: FIBERPLANE_COM_BUCKET_ID and FIBERPLANE_COM_CLOUDFRONT_ID environment variables are required." >&2
	exit 1
fi

if [ ! -d "$PUBLISH_DIR" ]; then
	echo "Error: Publish directory '$PUBLISH_DIR' does not exist. Make sure to build your project first." >&2
	exit 1
fi

# We record the author and commit hash in the metadata
# If the script was run by CI, we use the CI user and commit hash

aws s3 sync "$PUBLISH_DIR" "s3://${FIBERPLANE_COM_BUCKET_ID}" --delete --metadata "{\"author\":\"$(git config user.name)\",\"commit\":\"$(git rev-parse HEAD)\"}" || {
	echo "Error: Failed to sync with S3 bucket" >&2
	exit 1
}

aws cloudfront create-invalidation --distribution-id "${FIBERPLANE_COM_CLOUDFRONT_ID}" --paths "/*" --comment "Invalidation by $(git config user.name) for commit $(git rev-parse HEAD)" || {
	echo "Error: Failed to create CloudFront invalidation" >&2
	exit 1
}

echo "Deployment completed successfully."
