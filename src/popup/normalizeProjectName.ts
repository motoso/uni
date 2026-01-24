/**
 * Normalize Scrapbox project name from user input
 * - Extracts project name from full URL if provided
 * - Removes trailing slash
 *
 * @param input - User input (project name or URL)
 * @returns Normalized project name
 *
 * @example
 * normalizeProjectName("project-name") // => "project-name"
 * normalizeProjectName("project-name/") // => "project-name"
 * normalizeProjectName("https://scrapbox.io/project-name") // => "project-name"
 * normalizeProjectName("https://scrapbox.io/project-name/") // => "project-name"
 */
export function normalizeProjectName(input: string): string {
  let projectName = input;

  // Extract project name from full URL if provided
  const urlMatch = projectName.match(/scrapbox\.io\/([^/?]+)/);
  if (urlMatch) {
    projectName = urlMatch[1];
  }

  // Remove trailing slash
  projectName = projectName.replace(/\/$/, '');

  return projectName;
}
