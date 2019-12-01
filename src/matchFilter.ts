/**
 *  Examines the character span matched by the pattern and determines
 *  if the match should be turned into an actionable link.
 *
 *  MatchFilter enables client code to have more control over
 *  what is allowed to match and become a link, and what is not.
 *
 *  For example:  when matching web URLs you would like things like
 *  http://www.example.com to match, as well as just example.com itelf.
 *  However, you would not want to match against the domain in
 *  support@example.com.  So, when matching against a web URL pattern you
 *  might also include a MatchFilter that disallows the match if it is
 *  immediately preceded by an at-sign (@).
 *
 *  @param s        The body of text against which the pattern
 *                  was matched
 *  @param start    The index of the first character in s that was
 *                  matched by the pattern - inclusive
 *  @param end      The index of the last character in s that was
 *                  matched - exclusive
 *
 *  @return         Whether this match should be turned into a link
 */
export type MatchFilter = (s: string, start: number, end: number) => boolean;