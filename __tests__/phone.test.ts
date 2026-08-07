/*
 * Copyright (C) 2010 The Android Open Source Project
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

import { expect, test } from "vitest";
import {
    addAutoLinks,
    ALL_NO_PHONE,
    EMAIL_ADDRESSES,
    PHONE_NUMBERS,
    WEB_URLS,
} from "../src/linkify";
import { PHONE } from "../src/patterns";

/**
 * PHONE is a global regex, so it carries lastIndex state between calls. Build a
 * fresh one per assertion instead of sharing it.
 *
 * Java's Matcher.matches() requires the whole input to match, while find()
 * searches anywhere in it. These two helpers stand in for that distinction.
 */
function matches(input: string): boolean {
    return new RegExp(`^(?:${PHONE.source})$`).test(input);
}

function find(input: string): boolean {
    return new RegExp(PHONE.source).test(input);
}

/*
 * The cases below are taken from PatternsTest.testPhonePattern in the Android
 * sources, at
 * core/tests/coretests/src/android/util/PatternsTest.java
 * The inputs are reproduced verbatim, trailing newlines included.
 */

test("phone pattern matches a complete phone number", () => {
    expect(matches("(919) 555-1212")).toBe(true);
});

test("phone pattern does not match a non phone number", () => {
    expect(matches("2334 9323/54321")).toBe(false);
});

test.each([
    "Me: 16505551212 this\n",
    "Me: 6505551212 this\n",
    "Me: 5551212 this\n",
    "Me: 2211 this\n",
    "Me: 112 this\n",

    "Me: 1-650-555-1212 this\n",
    "Me: (650) 555-1212 this\n",
    "Me: +1 (650) 555-1212 this\n",
    "Me: +1-650-555-1212 this\n",
    "Me: 650-555-1212 this\n",
    "Me: 555-1212 this\n",

    "Me: 1.650.555.1212 this\n",
    "Me: (650) 555.1212 this\n",
    "Me: +1 (650) 555.1212 this\n",
    "Me: +1.650.555.1212 this\n",
    "Me: 650.555.1212 this\n",
    "Me: 555.1212 this\n",

    "Me: 1 650 555 1212 this\n",
    "Me: (650) 555 1212 this\n",
    "Me: +1 (650) 555 1212 this\n",
    "Me: +1 650 555 1212 this\n",
    "Me: 650 555 1212 this\n",
    "Me: 555 1212 this\n",
])("phone pattern finds a number in %j", (input) => {
    expect(find(input)).toBe(true);
});

/*
 * The tests below cover addAutoLinks rather than the pattern on its own. They
 * are not ported from Android, whose current implementation gathers phone
 * links through libphonenumber instead of Patterns.PHONE.
 */

test("phone number is linked with a tel scheme", () => {
    expect(addAutoLinks("Me: 16505551212 this")).toEqual([
        { url: "tel:16505551212", start: 4, end: 15 },
    ]);
});

test("punctuation is stripped from the tel url but not from the matched range", () => {
    expect(addAutoLinks("call +1 (650) 555-1212 now")).toEqual([
        { url: "tel:+16505551212", start: 5, end: 22 },
    ]);
});

test("dot separated phone number is linked", () => {
    expect(addAutoLinks("1.650.555.1212")).toEqual([{ url: "tel:16505551212", start: 0, end: 14 }]);
});

test("numbers with fewer digits than the minimum are not linked", () => {
    // The pattern itself matches both, it is the match filter that rejects
    // them for having fewer than PHONE_NUMBER_MINIMUM_DIGITS digits.
    expect(find("Me: 2211 this\n")).toBe(true);
    expect(addAutoLinks("Me: 2211 this")).toEqual(false);

    expect(find("Me: 112 this\n")).toBe(true);
    expect(addAutoLinks("Me: 112 this")).toEqual(false);
});

test("phone numbers can be gathered on their own", () => {
    expect(addAutoLinks("Me: 16505551212 this", PHONE_NUMBERS)).toEqual([
        { url: "tel:16505551212", start: 4, end: 15 },
    ]);
});

test("a mask without PHONE_NUMBERS does not link phone numbers", () => {
    expect(addAutoLinks("Me: 16505551212 this", WEB_URLS)).toEqual(false);
    expect(addAutoLinks("Me: 16505551212 this", EMAIL_ADDRESSES)).toEqual(false);
});

test("ALL_NO_PHONE links urls and emails but not phone numbers", () => {
    expect(addAutoLinks("call 16505551212 or mail test@example.com", ALL_NO_PHONE)).toEqual([
        { url: "mailto:test@example.com", start: 25, end: 41 },
    ]);
    expect(addAutoLinks("x http://google.com/ x", ALL_NO_PHONE)).toEqual([
        { url: "http://google.com", start: 2, end: 19 },
    ]);
    expect(addAutoLinks("Me: 16505551212 this", ALL_NO_PHONE)).toEqual(false);
});

test("phone numbers are gathered alongside urls and emails, sorted by position", () => {
    expect(addAutoLinks("call 16505551212 or mail test@example.com")).toEqual([
        { url: "tel:16505551212", start: 5, end: 16 },
        { url: "mailto:test@example.com", start: 25, end: 41 },
    ]);
});
