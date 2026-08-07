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

import { defineConfig } from "tsdown";

/**
 * Bundling drops the per-file license headers, so the emitted files carry
 * none of their own. Re-add one as a banner to keep the notice on what is
 * actually published.
 */
const licenseBanner = `/*
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
 */`;

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "es2023",
    platform: "neutral",
    dts: true,
    sourcemap: true,
    clean: true,
    unbundle: true,
    attw: { profile: "esm-only" },
    publint: true,
    unused: true,
    banner: {
        js: licenseBanner,
        dts: licenseBanner,
    },
});
