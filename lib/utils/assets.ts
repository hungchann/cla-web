/**
 * Builds the URL for an image asset stored in Directus.
 * 
 * @param filename - The filename_disk or uri of the image
 * @param fallback - Optional fallback image URL if the filename is not provided
 * @returns The absolute URL to the image asset
 */
export function getAssetUrl(filename?: string | null): string;
export function getAssetUrl(filename: string | null | undefined, fallback: null): string | null;
export function getAssetUrl(filename: string | null | undefined, fallback: string): string;
export function getAssetUrl(filename?: string | null, fallback?: string | null): string | null {
  if (filename) {
    // If it's already an absolute URL, return it
    if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("/")) {
      return filename;
    }
    // Specific fallback for mock data
    if (filename === "study_tablet.png") {
      return `/images/study_tablet.png`;
    }
    return `https://marutek.space/assets/${filename}`;
  }
  if (fallback === null) return null;
  return fallback || "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop";
}
