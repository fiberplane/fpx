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

S3_BUCKET_ID=""
CF_DISTRIBUTION_ID=""
PUBLISH_DIR=""
DRY_RUN=false

display_usage() {
	echo ""
	echo "Usage: $0 [OPTIONS]"
	echo "Deploy website to S3 and invalidate CloudFront distribution."
	echo
	echo "Options:"
	echo "  --s3-bucket-id=ID        Specify the S3 bucket ID (required)"
	echo "  --cf-distribution-id=ID  Specify the CloudFront distribution ID (required)"
	echo "  --publish-dir=DIR        Specify the directory to publish (default: dist)"
	echo "  --dry-run                Perform a dry run without making changes"
	echo "  --help                   Display this help message and exit"
	echo
	echo "Example:"
	echo "  $0 --s3-bucket-id=my-bucket --cf-distribution-id=ABCDEF123456 --publish-dir=./dist"
}

while [[ "$#" -gt 0 ]]; do
	case $1 in
	--s3-bucket-id | --s3-bucket-id=*)
		if [[ "$1" == *=* ]]; then
			S3_BUCKET_ID="${1#*=}"
		else
			S3_BUCKET_ID="$2"
			shift
		fi
		;;
	--cf-distribution-id | --cf-distribution-id=*)
		if [[ "$1" == *=* ]]; then
			CF_DISTRIBUTION_ID="${1#*=}"
		else
			CF_DISTRIBUTION_ID="$2"
			shift
		fi
		;;
	--publish-dir | --publish-dir=*)
		if [[ "$1" == *=* ]]; then
			PUBLISH_DIR="${1#*=}"
		else
			PUBLISH_DIR="$2"
			shift
		fi
		;;
	--dry-run)
		DRY_RUN=true
		;;
	--help)
		display_usage
		exit 0
		;;
	*)
		echo "Unknown parameter passed: $1" >&2
		display_usage
		exit 1
		;;
	esac
	shift
done

if [ -z "$S3_BUCKET_ID" ] || [ -z "$CF_DISTRIBUTION_ID" ]; then
	echo "Error: S3 bucket ID and CloudFront distribution ID are required." >&2
	display_usage
	exit 1
fi

if [ -z "$PUBLISH_DIR" ]; then
	PUBLISH_DIR="dist"
fi

if [ ! -d "$PUBLISH_DIR" ]; then
	echo "Error: Publish directory '$PUBLISH_DIR' does not exist. Make sure to build your project first." >&2
	display_usage
	exit 1
fi

# We record the author and commit hash in the metadata
# If the script was run by CI, we use the CI user and commit hash
AUTHOR=$(git config user.name)
COMMIT_HASH=$(git rev-parse HEAD)

if [ "$DRY_RUN" = true ]; then
	aws s3 sync "$PUBLISH_DIR" "s3://$S3_BUCKET_ID" --delete --metadata "{\"author\":\"$AUTHOR\",\"commit\":\"$COMMIT_HASH\"}" --dryrun
else
	aws s3 sync "$PUBLISH_DIR" "s3://$S3_BUCKET_ID" --delete --metadata "{\"author\":\"$AUTHOR\",\"commit\":\"$COMMIT_HASH\"}" || {
		echo "Error: Failed to sync with S3 bucket" >&2
		exit 1
	}
fi

if [ "$DRY_RUN" = true ]; then
	echo "DRY RUN: Would execute the following command:"
	echo "aws cloudfront create-invalidation --distribution-id \"$CF_DISTRIBUTION_ID\" --paths \"/*\" --comment \"Invalidation by $AUTHOR for commit $COMMIT_HASH\""
else
	aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" --paths "/*" --comment "Invalidation by $AUTHOR for commit $COMMIT_HASH" || {
		echo "Error: Failed to create CloudFront invalidation" >&2
		exit 1
	}
fi

echo "Deployment completed successfully."
