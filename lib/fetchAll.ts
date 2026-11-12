/** The Supabase API returns at most this many rows per request, whatever range is asked for. */
const PAGE = 1000;

type PageResult = { data: unknown[] | null; error: { message: string } | null };

/**
 * Read every row of a query, page by page. `page` runs the query for one range;
 * the query must have a stable order, or rows can be skipped or repeated between pages.
 */
export async function fetchAllRows<T>(page: (from: number, to: number) => PromiseLike<PageResult>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}
