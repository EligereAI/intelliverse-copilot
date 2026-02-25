export async function transcribeAudio(
  blob: Blob,
  durationSecs: number,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");
  formData.append("endTime", String(durationSecs));

  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details ?? err.error ?? "Transcription failed");
  }

  const data = await res.json();
  return data.transcription as string;
}
