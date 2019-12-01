import { MatchFilter } from "./matchFilter";
import { isDigit } from "./utils";
import { TransformFilter } from "./transformFilter";
import { digitsAndPlusOnly, AUTOLINK_WEB_URL, AUTOLINK_EMAIL_ADDRESS } from "./patterns";
import { logError } from "./log";

/*
 * Copyright (C) 2007 The Android Open Source Project
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

/**
*  Linkify take a piece of text and a regular expression and turns all of the
*  regex matches in the text into clickable links.  This is particularly
*  useful for matching things like email addresses, web URLs, etc. and making
*  them actionable.
*
*  Alone with the pattern that is to be matched, a URL scheme prefix is also
*  required.  Any pattern match that does not begin with the supplied scheme
*  will have the scheme prepended to the matched text when the clickable URL
*  is created.  For instance, if you are matching web URLs you would supply
*  the scheme <code>http://</code>. If the pattern matches example.com, which
*  does not have a URL scheme prefix, the supplied scheme will be prepended to
*  create <code>http://example.com</code> when the clickable URL link is
*  created.
*
*  <p class="note"><b>Note:</b> When using {@link #MAP_ADDRESSES} or {@link #ALL}
*  to match street addresses on API level {@link android.os.Build.VERSION_CODES#O_MR1}
*  and earlier, methods in this class may throw
*  {@link android.util.AndroidRuntimeException} or other exceptions if the
*  device's WebView implementation is currently being updated, because
*  {@link android.webkit.WebView#findAddress} is required to match street
*  addresses.
*
* @see MatchFilter
* @see TransformFilter
*/


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

function pruneOverlaps(links: LinkSpec[]) {
    const c = (a: LinkSpec, b: LinkSpec) => {
        if (a.start < b.start) {
            return -1;
        }
        if (a.start > b.start) {
            return 1;
        }
        if (a.end < b.end) {
            return 1;
        }
        if (a.end > b.end) {
            return -1;
        }
        return 0;
    };

    links.sort(c);
    let len = links.length;
    let i = 0;
    while (i < len - 1) {
        const a = links[i];
        const b = links[i + 1];
        let remove = -1;
        if ((a.start <= b.start) && (a.end > b.start)) {
            if (b.end <= a.end) {
                remove = i + 1;
            } else if ((a.end - a.start) > (b.end - b.start)) {
                remove = i + 1;
            } else if ((a.end - a.start) < (b.end - b.start)) {
                remove = i;
            }
            if (remove != -1) {
                links.splice(remove, 1);
                len--;
                continue;
            }
        }
        i++;
    }
}

export interface LinkSpec {
    url: string;
    start: number;
    end: number;
}