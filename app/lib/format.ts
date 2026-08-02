export function formatRent(rentManYen: number): string {
  return `${rentManYen.toLocaleString("ja-JP", { minimumFractionDigits: rentManYen % 1 === 0 ? 0 : 1 })}万円`;
}

export function formatSize(sizeSqm: number): string {
  return `${sizeSqm.toLocaleString("ja-JP")}m²`;
}

export function formatWalkMinutes(walkMinutes: number): string {
  return `徒歩${walkMinutes}分`;
}

export function formatDistance(distanceMeters: number): string {
  return `${distanceMeters.toLocaleString("ja-JP")}m`;
}
