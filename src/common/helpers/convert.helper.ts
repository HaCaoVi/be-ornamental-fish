import { SortOrder } from 'mongoose';

export const normalizeFilters = (query: string) => {
  try {
    const filter: Record<string, any> = {};

    for (const [key, value] of Object.entries(JSON.parse(query))) {
      if (typeof value === 'string') {
        const regexMatch = value.match(/^\/(.*)\/([gimsuy]*)$/);
        if (regexMatch) {
          const pattern = regexMatch[1];
          const flags = regexMatch[2];

          if (pattern.trim() === '') {
            continue;
          }

          filter[key] = new RegExp(pattern, flags);
        } else {
          filter[key] = value;
        }
      } else {
        filter[key] = value;
      }
    }
    return filter;
  } catch {
    return {};
  }
};

export const normalizeSort = (
  sort: any,
  allowedFields: string[] = ['createdAt', 'updatedAt', 'email', 'name'],
): Record<string, SortOrder> => {
  if (!sort) return { createdAt: -1 };

  const normalizedSort: Record<string, SortOrder> = {};

  if (typeof sort === 'string') {
    const fields = sort.split(',');
    for (const field of fields) {
      const direction: SortOrder = field.startsWith('-') ? -1 : 1;
      const cleanField = field.replace(/^-/, '');
      if (allowedFields.includes(cleanField)) {
        normalizedSort[cleanField] = direction;
      }
    }
  } else if (typeof sort === 'object') {
    for (const [key, value] of Object.entries(sort)) {
      if (
        allowedFields.includes(key) &&
        (value === 1 || value === -1 || value === 'asc' || value === 'desc')
      ) {
        normalizedSort[key] = value as SortOrder;
      }
    }
  }

  return Object.keys(normalizedSort).length > 0
    ? normalizedSort
    : { createdAt: -1 };
};

export const parseFilters = (rawFilters: any) => {
  if (!rawFilters || rawFilters.length === 0) return {};

  let filters = rawFilters;

  if (typeof filters === 'string') {
    try {
      filters = JSON.parse(filters);
    } catch {
    }
  }
  if (filters.filters === '') return {};
  if (filters.filters && typeof filters.filters === 'string') {
    try {
      filters = JSON.parse(filters.filters);
    } catch { }
  }

  return filters;
};
