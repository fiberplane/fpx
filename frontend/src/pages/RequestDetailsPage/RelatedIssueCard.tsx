import { GithubIssue } from "@/queries/types";
import IssueIcon from "./IssueIcon.svg?react";
import { TimeAgo } from "./TimeAgo";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
// import Highlighter from "react-highlight-words";
import { Chunk, findAll } from "highlight-words-core";
import { removeStopwords, eng } from "stopword"

// import PullRequestIcon  from "@radix-ui/react-icons/dist/PullRequestIcon";
import PullRequestIcon from "./PullRequestIcon.svg?react";

// const insignificantWords = new Set([
//   "a", "an", "and", "are", "as", "has", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with", "set"
// ]);


function replaceNonWordsWithSpace(text: string) {
  // Regular expression to match all non-word and non-number characters using Unicode property escapes
  const regex = /[^\p{L}\p{N}]/gu;

  // Replace matched characters with a space
  let result = text.replace(regex, ' ');

  // Collapse multiple spaces into a single space
  result = result.replace(/\s+/g, ' ');

  return result.trim(); // Trim leading/trailing spaces
}


function getSignificantWords(query: string) {
  const words = replaceNonWordsWithSpace(query).split(/\s+/);
  return removeStopwords(words, eng);
}
const searchWords = getSignificantWords("No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?");

const sanitize = (text: string) => text;

const findChunks = ({
  autoEscape,
  caseSensitive,
  // sanitize = sanitize,
  searchWords,
  textToHighlight
}: {
  autoEscape?: boolean,
  caseSensitive?: boolean,
  // sanitize?: typeof defaultSanitize,
  searchWords: Array<string>,
  textToHighlight: string,
}): Array<Chunk> => {
  textToHighlight = sanitize(textToHighlight)
  console.log('text', textToHighlight)
  return searchWords
    .filter(searchWord => searchWord) // Remove empty words
    .reduce((chunks, searchWord) => {
      searchWord = sanitize(searchWord)

      if (autoEscape) {
        searchWord = escapeRegExpFn(searchWord)
      }

      const regex = new RegExp(`\\b${searchWord}\\b`, caseSensitive ? 'g' : 'gi')
      console.log('regex', regex);
      let match
      while ((match = regex.exec(textToHighlight))) {
        let start = match.index
        let end = regex.lastIndex
        // We do not return zero-length matches
        if (end > start) {
          chunks.push({ highlight: false, start, end })
        }

        // Prevent browsers like Firefox from getting stuck in an infinite loop
        // See http://www.regexguru.com/2008/04/watch-out-for-zero-length-matches/
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }

      return chunks
    }, [] as Array<Chunk>)
}

function escapeRegExpFn(string: string): string {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}


export function RelatedIssueCard(issue: GithubIssue) {
  console.log('------------------------------------')
  console.log('words', searchWords);
  console.log('title', issue.title);
  console.log('body', issue.body);
  console.log('------------------------------------')

  const chunks = findAll({
    searchWords: [...searchWords],
    textToHighlight: issue.body,
    findChunks,
  });

  // console.log('chunks', chunks)
  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        <div className="truncate text-sm font-medium flex gap-1 items-center">
          <RelatedIcon isPr={issue.url.includes("/pull/")} isClosed={!!issue.closedAt} />

          {issue.title}
        </div>
        <div className="ml-2 flex flex-shrink-0 text-gray-500 items-center gap-1">
          <GitHubLogoIcon />
          <span className="flex gap-1"><span>{issue.owner}</span><span>/</span><span>{issue.repo}</span></span>
        </div>
      </div>
      <div>
        {chunks.map((chunk, index) => {
          if (chunk.highlight === false) {
            return null;
          }
          const text = getSurroundingWords(issue.body, chunk.start, chunk.end);

          return <span key={index}>{text}{index < chunks.length - 1 ? "..." : ""} </span>;
        })}
      </div>
      <div className="mt-2 flex justify-between">
        <div className="sm:flex">
          <div className="mr-4 flex items-center text-sm text-gray-500">
            Created: <TimeAgo date={issue.createdAt} />
          </div>
          {issue.updatedAt && (
            issue.updatedAt !== issue.createdAt || issue.updatedAt !== issue.closedAt
          ) && <div className="mr-4 flex items-center text-sm text-gray-500">
              Updated: <TimeAgo date={issue.updatedAt} />
            </div>}
          {issue.closedAt && <div className="mr-4 flex items-center text-sm text-gray-500">
            Closed: <TimeAgo date={issue.closedAt} />
          </div>}
        </div>
      </div>
    </div >
  );

}



function RelatedIcon(props: { isPr: boolean; isClosed: boolean }) {
  const { isPr, isClosed } = props;

  const className = isClosed ? "text-purple-500" : "text-green-400";

  if (isPr) {
    return <PullRequestIcon className={className} />;
  }

  return <IssueIcon className={className} />
}


function getSurroundingWords(text: string, startIndex: number, endIndex: number) {
  // Ensure the indices are within the bounds of the text
  if (startIndex < 0 || endIndex > text.length || startIndex > endIndex) {
    throw new Error('Invalid start or end index');
  }

  // Get the text before, the search term, and the text after
  const before = text.substring(0, startIndex);
  const match = text.substring(startIndex, endIndex);
  const after = text.substring(endIndex);

  // Find the last space before the search term in the before text
  const beforeLastSpaceIndex = before.lastIndexOf(' ');

  // Find the first space after the search term in the after text
  const afterFirstSpaceIndex = after.indexOf(' ');

  // Extract the word before the search term
  const wordBefore = beforeLastSpaceIndex !== -1
    ? before.substring(beforeLastSpaceIndex + 1)
    : before;

  // Extract the word after the search term
  const wordAfter = afterFirstSpaceIndex !== -1
    ? after.substring(0, afterFirstSpaceIndex)
    : after;

  // Combine the word before, the match, and the word after
  return <>
    {wordBefore}
    <span className="bg-yellow-100">{match}</span>
    {wordAfter}
  </>;
}
