// Moves budget data files from the browser to the server in a form that fits
// under hosting request-size limits (Vercel: 4.5 MB). CSVs are gzipped in the
// browser and un-gzipped on the server; .xlsx files are already compressed
// internally, so they are sent as they are.

import { MAX_DATA_FILE_SIZE } from "./upload-limits";

export type DataFileEncoding = "gzip" | "identity";

/** Browser side: compress a CSV before upload when the browser supports it. */
export async function encodeDataFile(
  file: File
): Promise<{ file: File; encoding: DataFileEncoding }> {
  if (
    !file.name.toLowerCase().endsWith(".csv") ||
    typeof CompressionStream === "undefined"
  ) {
    return { file, encoding: "identity" };
  }
  const compressed = await new Response(
    file.stream().pipeThrough(new CompressionStream("gzip"))
  ).blob();
  return {
    file: new File([compressed], file.name, { type: "application/gzip" }),
    encoding: "gzip",
  };
}

export class DataFileTooLargeError extends Error {}

/**
 * Server side: return the file as the admin picked it, decompressing it if the
 * browser gzipped it. Stops reading past MAX_DATA_FILE_SIZE, so a small
 * compressed upload can't expand into an unbounded amount of memory.
 */
export async function decodeDataFile(
  file: File,
  encoding: FormDataEntryValue | null
): Promise<File> {
  if (encoding !== "gzip") return file;

  const reader = file
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_DATA_FILE_SIZE) {
      await reader.cancel();
      throw new DataFileTooLargeError();
    }
    chunks.push(value);
  }
  return new File(chunks as BlobPart[], file.name, { type: "text/csv" });
}
