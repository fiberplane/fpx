import { useEffect, useState } from "react";

function ImageBody({
  value,
  contentType,
}: { value: ArrayBuffer; contentType: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([value], { type: contentType });
    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value, contentType]);

  if (!imageUrl) {
    return null;
  }

  return <img src={imageUrl} alt="Response" className="max-w-full h-auto" />;
}

function AudioBody({
  value,
  contentType,
}: { value: ArrayBuffer; contentType: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([value], { type: contentType });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value, contentType]);

  if (!audioUrl) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/useMediaCaption: we do not have captions
    <audio src={audioUrl} controls className="w-full">
      Your browser does not support the audio element.
    </audio>
  );
}

export function ResponseBodyBinary({
  body,
}: {
  body: { contentType: string; type: "binary"; value: ArrayBuffer };
}) {
  const isImage = body.contentType.startsWith("image/");
  const isAudio = body.contentType.startsWith("audio/");

  if (isImage) {
    return <ImageBody value={body.value} contentType={body.contentType} />;
  }

  if (isAudio) {
    return <AudioBody value={body.value} contentType={body.contentType} />;
  }

  // TODO - Stylize for other binary types
  return <div>Binary response: {body.contentType}</div>;
}
