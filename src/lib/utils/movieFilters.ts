export function isMovieInYearRange(
  releaseDate: string | undefined | null,
  yearFrom?: number,
  yearTo?: number
): boolean {
  if (!yearFrom && !yearTo) {
    return true;
  }

  if (!releaseDate) {
    return false;
  }

  try {
    const year = new Date(releaseDate).getFullYear();
    
    if (!Number.isFinite(year) || isNaN(year)) {
      return false;
    }

    const meetsMinYear = !yearFrom || year >= yearFrom;
    const meetsMaxYear = !yearTo || year <= yearTo;
    return meetsMinYear && meetsMaxYear;
  } catch {
    return false;
  }
}
