import { nullableParam } from './typed-sql.util';

describe('nullableParam', () => {
  it('should return null for undefined', () => {
    expect(nullableParam(undefined)).toBeNull();
  });

  it('should return null for null', () => {
    expect(nullableParam(null)).toBeNull();
  });

  it('should pass through string value', () => {
    expect(nullableParam('hello')).toBe('hello');
  });

  it('should pass through number value', () => {
    expect(nullableParam(42)).toBe(42);
  });

  it('should pass through empty string', () => {
    expect(nullableParam('')).toBe('');
  });

  it('should pass through zero', () => {
    expect(nullableParam(0)).toBe(0);
  });
});
