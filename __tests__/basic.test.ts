/*
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
import { addAutoLinks } from "../src/linkify";

test("empty", () => {
    const result = addAutoLinks("");
    expect(result).toEqual(false);
});

test("nothing to empty text", () => {
    const result = addAutoLinks("hello world");
    expect(result).toEqual(false);
});

test("full text link", () => {
    const result = addAutoLinks("http://google.com/");
    expect(result).toEqual([{ url: "http://google.com/", start: 0, end: 18 }]);
});

test("full text smart", () => {
    const result = addAutoLinks("google.com");
    expect(result).toEqual([{ url: "http://google.com", start: 0, end: 10 }]);
});

test("inner text link", () => {
    const result = addAutoLinks("x http://google.com/ x");
    expect(result).toEqual([{ url: "http://google.com", start: 2, end: 19 }]);
});

test("full text email", () => {
    const result = addAutoLinks("test@example.com");
    expect(result).toEqual([{ url: "mailto:test@example.com", start: 0, end: 16 }]);
});

test("inner text email", () => {
    const result = addAutoLinks("x test@example.com x");
    expect(result).toEqual([{ url: "mailto:test@example.com", start: 2, end: 18 }]);
});
