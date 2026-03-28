export function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

export function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function categoryPath(category: string) {
  return `/categories/${encodePathSegment(category)}/`;
}

export function tagPath(tag: string) {
  return `/tags/${encodePathSegment(tag)}/`;
}
