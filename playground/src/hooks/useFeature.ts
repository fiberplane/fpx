export function useFeature(featureName: string): boolean {
  try {
    // Check localStorage for feature flag
    const storedValue = localStorage.getItem(`fpx.${featureName}`);

    // Return true if the feature is explicitly enabled in localStorage
    if (storedValue === "true") {
      return true;
    }

    // Return false by default or if explicitly disabled
    return false;
  } catch (error) {
    // If there is an error, return false
    return false;
  }
}
