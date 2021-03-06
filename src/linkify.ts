/*
 * Copyright (C) 2007 The Android Open Source Project
 * Copyright (C) 2019 Julien Roncaglia <julien@roncaglia.fr>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isDigit } from "./utils";
import { digitsAndPlusOnly, AUTOLINK_WEB_URL, AUTOLINK_EMAIL_ADDRESS } from "./patterns";
import { logError } from "./log";
import { LinkSpec, pruneOverlaps } from "./LinkSpec";

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

/**
 *  Examines the matched text and either passes it through or uses the
 *  data in the Matcher state to produce a replacement.
 * 
 *  TransformFilter enables client code to have more control over
 *  how matched patterns are represented as URLs.
 *
 *  For example:  when converting a phone number such as (919)  555-1212
 *  into a tel: URL the parentheses, white space, and hyphen need to be
 *  removed to produce tel:9195551212.
 *
 *  @param match    The regex matcher state that found this URL text
 *  @param url      The text that was matched
 *
 *  @return         The transformed form of the URL
 */
export type TransformFilter = (match: RegExpExecArray, url: string) => string;

/**
 *  Bit field indicating that web URLs should be matched in methods that
 *  take an options mask
 */
export const WEB_URLS = 0x01;

/**
 *  Bit field indicating that email addresses should be matched in methods
 *  that take an options mask
 */
export const EMAIL_ADDRESSES = 0x02;

/**
 *  Bit mask indicating that all available patterns should be matched in
 *  methods that take an options mask
 *  <p><strong>Note:</strong></p> {@link #MAP_ADDRESSES} is deprecated.
 *  Use {@link android.view.textclassifier.TextClassifier#generateLinks(TextLinks.Request)}
 *  instead and avoid it even when targeting API levels where no alternative is available.
 */
export const ALL = WEB_URLS | EMAIL_ADDRESSES;

/**
 * Don't treat anything with fewer than this many digits as a
 * phone number.
 */
export const PHONE_NUMBER_MINIMUM_DIGITS = 5;

/**
 *  Filters out web URL matches that occur after an at-sign (@).  This is
 *  to prevent turning the domain name in an email address into a web link.
 */
const sUrlMatchFilter: MatchFilter = (s, start, end) => {
    if (start == 0) {
        return true;
    }
    if (s.charAt(start - 1) == '@') {
        return false;
    }
    return true;
};

/**
 *  Filters out URL matches that don't have enough digits to be a
 *  phone number.
 */
const sPhoneNumberMatchFilter: MatchFilter = (s, start, end) => {
    let digitCount = 0;
    for (let i = start; i < end; i++) {
        if (isDigit(s.charAt(i))) {
            digitCount++;
            if (digitCount >= PHONE_NUMBER_MINIMUM_DIGITS) {
                return true;
            }
        }
    }
    return false;
};
/**
 *  Transforms matched phone number text into something suitable
 *  to be used in a tel: URL.  It does this by removing everything
 *  but the digits and plus signs.  For instance:
 *  &apos;+1 (919) 555-1212&apos;
 *  becomes &apos;+19195551212&apos;
 */
const sPhoneNumberTransformFilter: TransformFilter = (match) => digitsAndPlusOnly(match);

/**
 *  Scans the text of the provided Spannable and turns all occurrences of the link types
 *  indicated in the mask into clickable links. If the mask is nonzero, it also removes any
 *  existing URLSpans attached to the Spannable, to avoid problems if you call it repeatedly
 *  on the same text.
 *
 * @param text Spannable whose text is to be marked-up with links
 * @param mask mask to define which kinds of links will be searched
 * @param context Context to be used while identifying phone numbers
 * @param urlSpanFactory function used to create {@link URLSpan}s
 * @return true if at least one link is found and applied.
 */
export function addAutoLinks(text: string, mask?: number): LinkSpec[] | false {
    if (mask === undefined) {
        mask = ALL;
    }
    if (text != null && containsUnsupportedCharacters(text.toString())) {
        return false;
    }
    if (mask == 0) {
        return false;
    }

    const links: LinkSpec[] = [];
    if ((mask & WEB_URLS) != 0) {
        gatherLinks(links, text, AUTOLINK_WEB_URL,
            ["http://", "https://", "rtsp://"],
            sUrlMatchFilter, undefined);
    }
    if ((mask & EMAIL_ADDRESSES) != 0) {
        gatherLinks(links, text, AUTOLINK_EMAIL_ADDRESS,
            ["mailto:"],
            undefined, undefined);
    }
    pruneOverlaps(links);
    if (links.length == 0) {
        return false;
    }

    return links;
}
/**
 * Returns true if the specified text contains at least one unsupported character for applying
 * links. Also logs the error.
 *
 * @param text the text to apply links to
 * @hide
 */
function containsUnsupportedCharacters(text: string) {
    if (text.indexOf("\u202C") !== -1) {
        logError("Unsupported character for applying links: u202C");
        return true;
    }
    if (text.indexOf("\u202D") !== -1) {
        logError("Unsupported character for applying links: u202D");
        return true;
    }
    if (text.indexOf("\u202E") !== -1) {
        logError("Unsupported character for applying links: u202E");
        return true;
    }
    return false;
}

/**
 * Applies a regex to a Spannable turning the matches into links.
 *
 * @param spannable       spannable whose text is to be marked-up with links.
 * @param pattern         regex pattern to be used for finding links.
 * @param defaultScheme   the default scheme to be prepended to links if the link does not
 *                        start with one of the <code>schemes</code> given.
 * @param schemes         array of schemes (eg <code>http://</code>) to check if the link found
 *                        contains a scheme. Passing a null or empty value means prepend
 *                        defaultScheme
 *                        to all links.
 * @param matchFilter     the filter that is used to allow the client code additional control
 *                        over which pattern matches are to be converted into links.
 * @param transformFilter filter to allow the client code to update the link found.
 * @param urlSpanFactory  function used to create {@link URLSpan}s
 *
 * @return True if at least one link is found and applied.
 */
export function addLinks(spannable: string, pattern: RegExp,
    defaultScheme: string | undefined, schemes: string[] | undefined,
    matchFilter: MatchFilter | undefined, transformFilter: TransformFilter) {
    if (spannable != null && containsUnsupportedCharacters(spannable.toString())) {
        return false;
    }

    let schemesCopy: string[];
    if (defaultScheme == null) defaultScheme = "";
    if (schemes == null || schemes.length < 1) {
        schemes = [];
    }
    schemesCopy = [];
    schemesCopy.push(defaultScheme.toLowerCase());
    for (const scheme of schemes) {
        schemesCopy.push((scheme == undefined) ? "" : scheme.toLowerCase())
    }

    let links: LinkSpec[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(spannable)) != null) {
        const start = m.index;
        const end = m.index + m[0].length;
        let allowed = true;
        if (matchFilter != null) {
            allowed = matchFilter(spannable, start, end);
        }
        if (allowed) {
            const url = makeUrl(m[0], schemesCopy, m, transformFilter);
            links.push({ url, start, end });
        }
    }

    return links;
}

function makeUrl(url: string, prefixes: string[],
    matcher: RegExpExecArray, filter: TransformFilter | undefined) {
    if (filter !== undefined) {
        url = filter(matcher, url);
    }

    let hasPrefix = false;
    for (let i = 0; i < prefixes.length; i++) {
        if (url.length < prefixes[i].length) {
            continue;
        }

        const urlPrefixRange = url.substring(0, prefixes[i].length);
        if (urlPrefixRange.localeCompare(prefixes[i], undefined, { sensitivity: 'accent' }) === 0) {
            hasPrefix = true;
            // Fix capitalization if necessary
            if (urlPrefixRange.localeCompare(prefixes[i], undefined, { sensitivity: 'case' }) !== 0) {
                url = prefixes[i] + url.substring(prefixes[i].length);
            }
            break;
        }
    }

    if (!hasPrefix && prefixes.length > 0) {
        url = prefixes[0] + url;
    }

    return url;
}

function gatherLinks(links: LinkSpec[],
    s: string, pattern: RegExp, schemes: string[],
    matchFilter: MatchFilter | undefined, transformFilter: TransformFilter | undefined) {

    let m: RegExpExecArray | null;
    while ((m = pattern.exec(s)) != null) {
        const start = m.index;
        const end = start + m[0].length;
        if (matchFilter === undefined || matchFilter(s, start, end)) {
            const url = makeUrl(m[0], schemes, m, transformFilter);
            const spec: LinkSpec = { url, start, end };
            links.push(spec);
        }
    }
}
