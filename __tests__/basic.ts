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
    expect(result).toEqual([{ url: 'http://google.com/', start: 0, end: 18 }]);
})

test('full text smart', () => {
    const result = addAutoLinks('google.com');
    expect(result).toEqual([{ url: 'http://google.com', start: 0, end: 10 }]);
})

test('inner text link', () => {
    const result = addAutoLinks('x http://google.com/ x');
    expect(result).toEqual([{ url: 'http://google.com', start: 2, end: 19 }]);
})

test('full text email', () => {
    const result = addAutoLinks('test@example.com');
    expect(result).toEqual([{ url: 'mailto:test@example.com', start: 0, end: 16 }]);
})

test('inner text email', () => {
    const result = addAutoLinks('x test@example.com x');
    expect(result).toEqual([{ url: 'mailto:test@example.com', start: 2, end: 18 }]);
})