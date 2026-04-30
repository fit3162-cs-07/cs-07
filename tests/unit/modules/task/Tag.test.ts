import { Tag } from '../../../../src/modules/task/domain/Tag';

describe('Tag value object', () => {
  it('should normalize to lowercase and trim whitespace', () => {
    const tag = Tag.create('  Urgent  ');
    expect(tag.value).toBe('urgent');
  });

  it('should reject empty strings', () => {
    expect(() => Tag.create('')).toThrow('VALIDATION_ERROR');
    expect(() => Tag.create('   ')).toThrow('VALIDATION_ERROR');
  });

  it('should reject tags longer than 30 characters', () => {
    expect(() => Tag.create('a'.repeat(31))).toThrow('VALIDATION_ERROR');
  });

  it('should accept tags exactly 30 characters', () => {
    const tag = Tag.create('a'.repeat(30));
    expect(tag.value).toBe('a'.repeat(30));
  });

  it('should check equality', () => {
    const a = Tag.create('urgent');
    const b = Tag.create('URGENT');
    expect(a.equals(b)).toBe(true);
  });

  describe('createMany', () => {
    it('should deduplicate tags', () => {
      const tags = Tag.createMany(['urgent', 'URGENT', 'backend']);
      expect(tags).toHaveLength(2);
      expect(tags.map(t => t.value)).toEqual(['urgent', 'backend']);
    });

    it('should reject more than 10 tags', () => {
      const raw = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      expect(() => Tag.createMany(raw)).toThrow('VALIDATION_ERROR');
    });

    it('should accept exactly 10 tags', () => {
      const raw = Array.from({ length: 10 }, (_, i) => `tag${i}`);
      const tags = Tag.createMany(raw);
      expect(tags).toHaveLength(10);
    });
  });
});
