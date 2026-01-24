/**
 * Normalize Scrapbox project name from user input
 * - Trims whitespace
 * - Extracts project name from full URL if provided
 * - Removes trailing slash(es)
 *
 * @param input - User input (project name or URL)
 * @returns Normalized project name
 */
export function normalizeProjectName(input: string): string {
  let projectName = input.trim();

  // Extract project name from full URL if provided
  // Supports: https://, http://, protocol-less, query params, hash fragments
  const urlMatch = projectName.match(/(?:https?:\/\/)?scrapbox\.io\/([^\/?#]+)/);
  if (urlMatch) {
    projectName = urlMatch[1];
  }

  // Remove trailing slash(es)
  projectName = projectName.replace(/\/+$/, '');

  return projectName;
}
