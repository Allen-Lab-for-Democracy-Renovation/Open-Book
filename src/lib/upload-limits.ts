// Single source of truth for upload limits, so the number shown to an admin
// before they pick a file always matches the one enforced on the server.

export const MAX_PDF_SIZE = 10 * 1024 * 1024;
export const MAX_PDF_SIZE_LABEL = "10 MB";

// Cap on the image an admin picks. It is downscaled in the browser before
// upload, so this only needs to be small enough that the browser can decode it.
export const MAX_LOGO_SOURCE_SIZE = 10 * 1024 * 1024;
export const MAX_LOGO_SOURCE_SIZE_LABEL = "10 MB";

// Cap on what the server will store, applied to the downscaled image.
export const MAX_LOGO_SIZE = 1024 * 1024;
export const MAX_LOGO_SIZE_LABEL = "1 MB";

export const MAX_DATA_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_DATA_FILE_SIZE_LABEL = "10 MB";
