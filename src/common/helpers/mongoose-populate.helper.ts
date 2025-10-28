type PopulateConfig = {
  path: string;
  select: string;
  options: { lean: true };
};

export const buildPopulateConfigFromStrings = (
  populateStr: string,
  fieldsStr: string,
): PopulateConfig[] => {
  if (!populateStr) return [];
  if (!fieldsStr) return [];

  const paths = populateStr.split(',').map((p) => p.trim());
  const fieldsList = fieldsStr ? fieldsStr.split(',').map((f) => f.trim()) : [];

  // map path -> field[]
  const map: Record<string, string[]> = {};
  for (const path of paths) {
    map[path] = [];
  }

  for (const f of fieldsList) {
    const [path, field] = f.split('.');
    if (map[path]) {
      map[path].push(field);
    }
  }

  return Object.entries(map).map(([path, fields]) => ({
    path: path,
    select: fields.join(' '),
    options: { lean: true },
  }));
};
