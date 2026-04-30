export class Tag {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Tag {
    const normalized = raw.trim().toLowerCase();
    if (normalized.length < 1) {
      throw new Error('VALIDATION_ERROR: Tag must be at least 1 character');
    }
    if (normalized.length > 30) {
      throw new Error('VALIDATION_ERROR: Tag must be at most 30 characters');
    }
    return new Tag(normalized);
  }

  static createMany(rawTags: string[]): Tag[] {
    if (rawTags.length > 10) {
      throw new Error('VALIDATION_ERROR: Maximum 10 tags per task');
    }
    const tags = rawTags.map(Tag.create);
    const unique = new Map<string, Tag>();
    for (const tag of tags) {
      unique.set(tag.value, tag);
    }
    return Array.from(unique.values());
  }

  equals(other: Tag): boolean {
    return this.value === other.value;
  }

  toJSON(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
