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

const DIGIT = /\p{Nd}/u;

/**
 * Whether a single character is a digit.
 *
 * Mirrors Java's Character.isDigit, which is Unicode aware and accepts any
 * character in the Nd (decimal number) category, not only ASCII 0-9.
 */
export function isDigit(c: string): boolean {
    return DIGIT.test(c);
}
