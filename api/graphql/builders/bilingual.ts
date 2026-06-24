import { SECTIONS_LIST_SELECTION } from "@/api/graphql/builders/bilingualSelection";

export function buildBilingualItemsPagedQuery(params: {
  limit: number;
  offset: number;
  listSuffix: string;
  aggregateArgs: string;
}) {
  const { limit, offset, listSuffix, aggregateArgs } = params;
  return `
    query {
      list: Sections(
        sort: ["-date_created"],
        limit: ${limit},
        offset: ${offset}${listSuffix}
      ) {
        ${SECTIONS_LIST_SELECTION}
      }
      meta: Sections_aggregated${aggregateArgs} {
        count {
          id
        }
      }
    }
  `;
}
