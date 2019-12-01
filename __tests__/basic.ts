import { addAutoLinks } from '../src/linkify';

test('empty', () => {
    const result = addAutoLinks('');
    expect(result).toEqual(false);
})

test('nothing to empty text', () => {
    const result = addAutoLinks('hello world');
    expect(result).toEqual(false);
})

test('full text link', () => {
    const result = addAutoLinks('http://google.com/');
    expect(result).toEqual(false);
})
/*
test('innter text link', () => {
    const result = addAutoLinks('Please go to http://google.com/ and enter your search');
    expect(result).toEqual(false);
})*/
