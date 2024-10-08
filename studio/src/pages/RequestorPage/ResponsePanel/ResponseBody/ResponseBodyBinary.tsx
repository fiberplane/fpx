export function ResponseBodyBinary({
  body,
}: {
  body: { contentType: string; type: "binary"; value: ArrayBuffer };
}) {
  const isImage = body.contentType.startsWith("image/");

  if (isImage) {
    const blob = new Blob([body.value], { type: body.contentType });
    const imageUrl = URL.createObjectURL(blob);
    return (
      <img
        src={imageUrl}
        alt="Response"
        className="max-w-full h-auto"
        onLoad={() => URL.revokeObjectURL(imageUrl)}
      />
    );
  }

  // TODO - Stylize
  return <div>Binary response {body.contentType}</div>;
}
