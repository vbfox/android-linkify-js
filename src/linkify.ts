import { MatchFilter } from "./matchFilter";
import { isDigit } from "./utils";
import { TransformFilter } from "./transformFilter";
import { digitsAndPlusOnly } from "./patterns";
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
 *  Bit field indicating that phone numbers should be matched in methods that
 *  take an options mask
 */
export const PHONE_NUMBERS = 0x04;

/**
 *  Bit mask indicating that all available patterns should be matched in
 *  methods that take an options mask
 *  <p><strong>Note:</strong></p> {@link #MAP_ADDRESSES} is deprecated.
 *  Use {@link android.view.textclassifier.TextClassifier#generateLinks(TextLinks.Request)}
 *  instead and avoid it even when targeting API levels where no alternative is available.
 */
export const ALL = WEB_URLS | EMAIL_ADDRESSES | PHONE_NUMBERS;

/**
 * Don't treat anything with fewer than this many digits as a
 * phone number.
 */
export const PHONE_NUMBER_MINIMUM_DIGITS = 5;
 
    /**
     *  Filters out web URL matches that occur after an at-sign (@).  This is
     *  to prevent turning the domain name in an email address into a web link.
     */
    const sUrlMatchFilter: MatchFilter = (s, start, end)  => {
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
    const sPhoneNumberMatchFilter: MatchFilter = (s, start, end)  => {
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

class Spannable {

}
class URLSpan { }
    /**
     *  Scans the text of the provided Spannable and turns all occurrences
     *  of the link types indicated in the mask into clickable links.
     *  If the mask is nonzero, it also removes any existing URLSpans
     *  attached to the Spannable, to avoid problems if you call it
     *  repeatedly on the same text.
     *
     *  @param text Spannable whose text is to be marked-up with links
     *  @param mask mask to define which kinds of links will be searched
     *  @param urlSpanFactory function used to create {@link URLSpan}s
     *  @return True if at least one link is found and applied.
     */
    export function addLinks(text: Spannable, mask: number, urlSpanFactory: (span: string) => URLSpan): boolean {
        return addLinks_(text, mask, null, urlSpanFactory);
    }
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
    FUNCTION addLinks_(@NonNull Spannable text, @LinkifyMask int mask,
            @Nullable Context context, @Nullable Function<String, URLSpan> urlSpanFactory) {
        if (text != null && containsUnsupportedCharacters(text.toString())) {
            android.util.EventLog.writeEvent(0x534e4554, "116321860", -1, "");
            return false;
        }
        if (mask == 0) {
            return false;
        }
        URLSpan[] old = text.getSpans(0, text.length(), URLSpan.class);
        for (int i = old.length - 1; i >= 0; i--) {
            text.removeSpan(old[i]);
        }
        ArrayList<LinkSpec> links = new ArrayList<LinkSpec>();
        if ((mask & WEB_URLS) != 0) {
            gatherLinks(links, text, Patterns.AUTOLINK_WEB_URL,
                new String[] { "http://", "https://", "rtsp://" },
                sUrlMatchFilter, null);
        }
        if ((mask & EMAIL_ADDRESSES) != 0) {
            gatherLinks(links, text, Patterns.AUTOLINK_EMAIL_ADDRESS,
                new String[] { "mailto:" },
                null, null);
        }
        if ((mask & PHONE_NUMBERS) != 0) {
            gatherTelLinks(links, text, context);
        }
        if ((mask & MAP_ADDRESSES) != 0) {
            gatherMapLinks(links, text);
        }
        pruneOverlaps(links);
        if (links.size() == 0) {
            return false;
        }
        for (LinkSpec link: links) {
            applyLink(link.url, link.start, link.end, text, urlSpanFactory);
        }
        return true;
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
     *  Applies a regex to the text of a TextView turning the matches into
     *  links.  If links are found then UrlSpans are applied to the link
     *  text match areas, and the movement method for the text is changed
     *  to LinkMovementMethod.
     *
     *  @param text TextView whose text is to be marked-up with links.
     *  @param pattern Regex pattern to be used for finding links.
     *  @param defaultScheme The default scheme to be prepended to links if the link does not
     *                       start with one of the <code>schemes</code> given.
     *  @param schemes Array of schemes (eg <code>http://</code>) to check if the link found
     *                 contains a scheme. Passing a null or empty value means prepend defaultScheme
     *                 to all links.
     *  @param matchFilter  The filter that is used to allow the client code additional control
     *                      over which pattern matches are to be converted into links.
     *  @param transformFilter Filter to allow the client code to update the link found.
     */
    void addLinks(@NonNull TextView text, @NonNull Pattern pattern,
             @Nullable  String defaultScheme, @Nullable String[] schemes,
             @Nullable MatchFilter matchFilter, @Nullable TransformFilter transformFilter) {
        SpannableString spannable = SpannableString.valueOf(text.getText());
        boolean linksAdded = addLinks(spannable, pattern, defaultScheme, schemes, matchFilter,
                transformFilter);
        if (linksAdded) {
            text.setText(spannable);
            addLinkMovementMethod(text);
        }
    }
    /**
     *  Applies a regex to a Spannable turning the matches into
     *  links.
     *
     *  @param text         Spannable whose text is to be marked-up with links
     *  @param pattern      Regex pattern to be used for finding links
     *  @param scheme       URL scheme string (eg <code>http://</code>) to be
     *                      prepended to the links that do not start with this scheme.
     * @see #addLinks(Spannable, Pattern, String, String[], MatchFilter, TransformFilter, Function)
     */
    boolean addLinks(@NonNull Spannable text, @NonNull Pattern pattern,
            @Nullable String scheme) {
        return addLinks(text, pattern, scheme, null, null, null);
    }
    /**
     * Applies a regex to a Spannable turning the matches into
     * links.
     *
     * @param spannable    Spannable whose text is to be marked-up with links
     * @param pattern      Regex pattern to be used for finding links
     * @param scheme       URL scheme string (eg <code>http://</code>) to be
     *                     prepended to the links that do not start with this scheme.
     * @param matchFilter  The filter that is used to allow the client code
     *                     additional control over which pattern matches are
     *                     to be converted into links.
     * @param transformFilter Filter to allow the client code to update the link found.
     *
     * @return True if at least one link is found and applied.
     * @see #addLinks(Spannable, Pattern, String, String[], MatchFilter, TransformFilter, Function)
     */
    boolean addLinks(@NonNull Spannable spannable, @NonNull Pattern pattern,
            @Nullable String scheme, @Nullable MatchFilter matchFilter,
            @Nullable TransformFilter transformFilter) {
        return addLinks(spannable, pattern, scheme, null, matchFilter,
                transformFilter);
    }
    /**
     * Applies a regex to a Spannable turning the matches into links.
     *
     * @param spannable Spannable whose text is to be marked-up with links.
     * @param pattern Regex pattern to be used for finding links.
     * @param defaultScheme The default scheme to be prepended to links if the link does not
     *                      start with one of the <code>schemes</code> given.
     * @param schemes Array of schemes (eg <code>http://</code>) to check if the link found
     *                contains a scheme. Passing a null or empty value means prepend defaultScheme
     *                to all links.
     * @param matchFilter  The filter that is used to allow the client code additional control
     *                     over which pattern matches are to be converted into links.
     * @param transformFilter Filter to allow the client code to update the link found.
     *
     * @return True if at least one link is found and applied.
     *
     * @see #addLinks(Spannable, Pattern, String, String[], MatchFilter, TransformFilter, Function)
     */
    boolean addLinks(@NonNull Spannable spannable, @NonNull Pattern pattern,
            @Nullable String defaultScheme, @Nullable String[] schemes,
            @Nullable MatchFilter matchFilter, @Nullable TransformFilter transformFilter) {
        return addLinks(spannable, pattern, defaultScheme, schemes, matchFilter, transformFilter,
                null);
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
    boolean addLinks(@NonNull Spannable spannable, @NonNull Pattern pattern,
            @Nullable String defaultScheme, @Nullable String[] schemes,
            @Nullable MatchFilter matchFilter, @Nullable TransformFilter transformFilter,
            @Nullable Function<String, URLSpan> urlSpanFactory) {
        if (spannable != null && containsUnsupportedCharacters(spannable.toString())) {
            android.util.EventLog.writeEvent(0x534e4554, "116321860", -1, "");
            return false;
        }
        String[] schemesCopy;
        if (defaultScheme == null) defaultScheme = "";
        if (schemes == null || schemes.length < 1) {
            schemes = EmptyArray.STRING;
        }
        schemesCopy = new String[schemes.length + 1];
        schemesCopy[0] = defaultScheme.toLowerCase(Locale.ROOT);
        for (int index = 0; index < schemes.length; index++) {
            String scheme = schemes[index];
            schemesCopy[index + 1] = (scheme == null) ? "" : scheme.toLowerCase(Locale.ROOT);
        }
        boolean hasMatches = false;
        Matcher m = pattern.matcher(spannable);
        while (m.find()) {
            int start = m.start();
            int end = m.end();
            boolean allowed = true;
            if (matchFilter != null) {
                allowed = matchFilter.acceptMatch(spannable, start, end);
            }
            if (allowed) {
                String url = makeUrl(m.group(0), schemesCopy, m, transformFilter);
                applyLink(url, start, end, spannable, urlSpanFactory);
                hasMatches = true;
            }
        }
        return hasMatches;
    }
    private void applyLink(String url, int start, int end, Spannable text,
            @Nullable Function<String, URLSpan> urlSpanFactory) {
        if (urlSpanFactory == null) {
            urlSpanFactory = DEFAULT_SPAN_FACTORY;
        }
        URLSpan span = urlSpanFactory.apply(url);
        text.setSpan(span, start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
    }
    private String makeUrl(@NonNull String url, @NonNull String[] prefixes,
            Matcher matcher, @Nullable TransformFilter filter) {
        if (filter != null) {
            url = filter.transformUrl(matcher, url);
        }
        boolean hasPrefix = false;
        for (int i = 0; i < prefixes.length; i++) {
            if (url.regionMatches(true, 0, prefixes[i], 0, prefixes[i].length())) {
                hasPrefix = true;
                // Fix capitalization if necessary
                if (!url.regionMatches(false, 0, prefixes[i], 0, prefixes[i].length())) {
                    url = prefixes[i] + url.substring(prefixes[i].length());
                }
                break;
            }
        }
        if (!hasPrefix && prefixes.length > 0) {
            url = prefixes[0] + url;
        }
        return url;
    }
    private void gatherLinks(ArrayList<LinkSpec> links,
            Spannable s, Pattern pattern, String[] schemes,
            MatchFilter matchFilter, TransformFilter transformFilter) {
        Matcher m = pattern.matcher(s);
        while (m.find()) {
            int start = m.start();
            int end = m.end();
            if (matchFilter == null || matchFilter.acceptMatch(s, start, end)) {
                LinkSpec spec = new LinkSpec();
                String url = makeUrl(m.group(0), schemes, m, transformFilter);
                spec.url = url;
                spec.start = start;
                spec.end = end;
                links.add(spec);
            }
        }
    }
    @UnsupportedAppUsage
    private void gatherTelLinks(ArrayList<LinkSpec> links, Spannable s,
            @Nullable Context context) {
        PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
        TelephonyManager tm = (context == null)
                ? TelephonyManager.getDefault()
                : TelephonyManager.from(context);
        Iterable<PhoneNumberMatch> matches = phoneUtil.findNumbers(s.toString(),
                tm.getSimCountryIso().toUpperCase(Locale.US),
                Leniency.POSSIBLE, Long.MAX_VALUE);
        for (PhoneNumberMatch match : matches) {
            LinkSpec spec = new LinkSpec();
            spec.url = "tel:" + PhoneNumberUtils.normalizeNumber(match.rawString());
            spec.start = match.start();
            spec.end = match.end();
            links.add(spec);
        }
    }

    private void pruneOverlaps(ArrayList<LinkSpec> links) {
        Comparator<LinkSpec>  c = new Comparator<LinkSpec>() {
            public int compare(LinkSpec a, LinkSpec b) {
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
            }
        };
        Collections.sort(links, c);
        int len = links.size();
        int i = 0;
        while (i < len - 1) {
            LinkSpec a = links.get(i);
            LinkSpec b = links.get(i + 1);
            int remove = -1;
            if ((a.start <= b.start) && (a.end > b.start)) {
                if (b.end <= a.end) {
                    remove = i + 1;
                } else if ((a.end - a.start) > (b.end - b.start)) {
                    remove = i + 1;
                } else if ((a.end - a.start) < (b.end - b.start)) {
                    remove = i;
                }
                if (remove != -1) {
                    links.remove(remove);
                    len--;
                    continue;
                }
            }
            i++;
        }
    }
    /**
     * Default factory function to create {@link URLSpan}s. While adding spans to a
     * {@link Spannable}, {@link Linkify} will call this function to create a {@link URLSpan}.
     */
    private Function<String, URLSpan> DEFAULT_SPAN_FACTORY =
            (String string) -> new URLSpan(string);
}

interface LinkSpec {
    url: string;
    start : number;
    end : number;
}