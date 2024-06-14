import { Chunk, findAll } from "highlight-words-core";

export function getChunks(text: string, searchWords: string[]) {
  const rawChunks = findAll({
    searchWords,
    textToHighlight: text,
    findChunks,
  }).filter((chunk) => chunk.highlight);

  const paddedChunks = addSurroundingWords(rawChunks, text);
  return mergeChunks(paddedChunks);
}

function mergeChunks(chunks: Array<Chunk>) {
  if (chunks.length === 0) {
    return [];
  }

  const mergedChunks: Chunk[] = [{ ...chunks[0] }];

  // Iterate through the chunks and merge adjacent ones
  for (let i = 1; i < chunks.length; i++) {
    const previous = mergedChunks[mergedChunks.length - 1];
    const current = { ...chunks[i] };

    if (previous.end > current.start) {
      previous.end = Math.max(previous.end, current.end);
      // Make highlight "contagious" this typically is what we want (i.e. it makes
      // highlighted chunks that are adjacent to each other merge together)
      // but actually isn't correct, it should only do that if there are no other "words" between them
      // However we don't store that information right now.
      previous.highlight = previous.highlight || current.highlight;
    } else {
      // Add the current chunk as a new merged chunk
      mergedChunks.push(current);
    }
  }

  return mergedChunks;
}

function addSurroundingWords(chunks: Array<Chunk>, text: string) {
  const allChunks: Array<Chunk> = [];

  for (const chunk of chunks) {
    const indexBefore = getPrefixIndex(text, chunk.start);
    if (indexBefore !== null) {
      allChunks.push({
        start: indexBefore,
        end: chunk.start,
        highlight: false,
      });
    }

    allChunks.push(chunk);

    const indexAfter = getSuffixIndex(text, chunk.end);
    if (indexAfter !== null) {
      allChunks.push({ start: chunk.end, end: indexAfter, highlight: false });
    }
  }

  return allChunks;
}

function getPrefixIndex(text: string, index: number) {
  if (index <= 0) {
    return null; // No word before the start of the string
  }

  // Get the substring up to the specified index
  const substring = text.slice(0, index);

  // Regular expression to find the last word in the substring
  const regex = /([^\w\s]?\b\w+\b[^\w]*$)/;

  // Execute the regex on the substring
  const match = regex.exec(substring);

  return match ? index - match[0].length : null;
}

function getSuffixIndex(text: string, index: number) {
  if (index >= text.length) {
    return null; // No word after the end of the string
  }

  // Get the substring starting from the adjusted index
  const substring = text.slice(index);

  // Regular expression to find the first word in the substring
  const regex = /^[^\w]*\b\w+\b[^\w\s]*/;

  // Execute the regex on the substring
  const match = regex.exec(substring);
  return match ? index + match[0].length : null;
}

const sanitize = (text: string) => text;

const findChunks = ({
  autoEscape,
  caseSensitive,
  // sanitize = sanitize,
  searchWords,
  textToHighlight,
}: {
  autoEscape?: boolean;
  caseSensitive?: boolean;
  // sanitize?: typeof defaultSanitize,
  searchWords: Array<string>;
  textToHighlight: string;
}): Array<Chunk> => {
  textToHighlight = sanitize(textToHighlight);
  return searchWords
    .filter((searchWord) => searchWord) // Remove empty words
    .reduce(
      (chunks, searchWord) => {
        searchWord = sanitize(searchWord);

        if (autoEscape) {
          searchWord = escapeRegExpFn(searchWord);
        }

        const regex = new RegExp(
          `\\b${searchWord}\\b`,
          caseSensitive ? "g" : "gi",
        );
        let match;
        while ((match = regex.exec(textToHighlight))) {
          const start = match.index;
          const end = regex.lastIndex;
          // We do not return zero-length matches
          if (end > start) {
            chunks.push({ highlight: false, start, end });
          }

          // Prevent browsers like Firefox from getting stuck in an infinite loop
          // See http://www.regexuru.com/2008/04/watch-out-for-zero-length-matches/
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }

        return chunks;
      },
      [] as Array<Chunk>,
    );
};

function escapeRegExpFn(string: string): string {
  return string.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
}
