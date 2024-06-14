import { eng, removeStopwords } from "stopword";

export function getSignificantWords(query: string) {
  const words = replaceNonWordsWithSpace(query).split(/\s+/);
  return removeStopwords(words, eng);
}

function replaceNonWordsWithSpace(text: string) {
  // Regular expression to match all non-word and non-number characters using Unicode property escapes
  const regex = /[^\p{L}\p{N}]/gu;

  // Replace matched characters with a space
  let result = text.replace(regex, " ");

  // Collapse multiple spaces into a single space
  result = result.replace(/\s+/g, " ");

  return result.trim(); // Trim leading/trailing spaces
}
