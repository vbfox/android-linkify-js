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

export interface LinkSpec {
    url: string;
    start: number;
    end: number;
}

export function pruneOverlaps(links: LinkSpec[]) {
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
