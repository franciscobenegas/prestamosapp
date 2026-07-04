export function toCountMap(rows: { value: string; count: number }[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.value] = row.count;
    return acc;
  }, {});
}
