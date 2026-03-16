export function getPagination(page = 1, limit = 10) {
  const take = limit;
  const skip = (page - 1) * limit;

  return { take, skip };
}
