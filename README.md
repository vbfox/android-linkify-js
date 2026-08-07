# android-linkify-js

A TypeScript port of Android's [`Linkify`](https://developer.android.com/reference/android/text/util/Linkify)
utility: it finds web URLs, email addresses and phone numbers in plain text and
reports where they are.

Unlike the Android original it does not touch spans or produce `URLSpan`s. It
returns the ranges it found and leaves rendering to the caller.

```ts
import { addAutoLinks } from "android-linkify-js";

addAutoLinks("call 16505551212 or visit google.com");
// [ { url: "tel:16505551212",    start: 5,  end: 16 },
//   { url: "http://google.com",  start: 26, end: 36 } ]

addAutoLinks("nothing here");
// false
```

`addAutoLinks` returns `false` rather than an empty array when nothing matches,
mirroring the boolean Android returns.

## Masks

The second argument selects what to look for. It defaults to `ALL`.

| Mask              | Value  | Matches                      |
| ----------------- | ------ | ---------------------------- |
| `WEB_URLS`        | `0x01` | web URLs                     |
| `EMAIL_ADDRESSES` | `0x02` | email addresses              |
| `PHONE_NUMBERS`   | `0x04` | phone numbers                |
| `ALL`             | `0x07` | all of the above             |
| `ALL_NO_PHONE`    | `0x03` | web URLs and email addresses |

```ts
import { addAutoLinks, ALL_NO_PHONE, PHONE_NUMBERS } from "android-linkify-js";

addAutoLinks(text, PHONE_NUMBERS); // phone numbers only
addAutoLinks(text, ALL_NO_PHONE); // everything except phone numbers
```

`ALL_NO_PHONE` has no Android equivalent. Phone matching is regex based and
links any run of five or more digits, which is not always wanted, so it is
worth having a mask that leaves it out.

## Relationship to the Android sources

This is a port of two files from the Android platform, as of **Android 10 (Q)**,
tag [`android-10.0.0_r1`](https://github.com/aosp-mirror/platform_frameworks_base/tree/android-10.0.0_r1):

| Android source                             | Ported to         |
| ------------------------------------------ | ----------------- |
| `core/java/android/text/util/Linkify.java` | `src/linkify.ts`  |
| `core/java/android/util/Patterns.java`     | `src/patterns.ts` |

It differs from the original in a few ways:

- **Phone numbers are matched with `Patterns.PHONE`, not libphonenumber.**
  Android gathers `tel:` links with libphonenumber, resolving a region code
  from the SIM or default locale. That would be a large runtime dependency for
  a package that currently has none, so the regex plus Android's
  `sPhoneNumberMatchFilter` and `sPhoneNumberTransformFilter` are used instead.
  The result is less accurate for international numbers.
- **`MAP_ADDRESSES` is not implemented.** It is deprecated upstream.
- **No `Spannable`, `URLSpan` or `Context`.** `addAutoLinks` returns
  `LinkSpec[] | false` instead of mutating a `Spannable` and returning a
  boolean.

## Development

```sh
yarn install     # installs deps and the pre-commit hook
yarn test        # vitest
yarn typecheck   # tsc --noEmit, since neither tsdown nor vitest checks types
yarn build       # tsdown, ESM only, output mirrors src/
yarn format      # prettier
```

Prettier runs on commit through lefthook and re-stages what it fixes.

## License

Apache 2.0, the same license as the Android sources this is derived from. See
[LICENSE](LICENSE).
