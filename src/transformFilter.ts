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
export type TransformFilter = (match: string, url: string) => string;