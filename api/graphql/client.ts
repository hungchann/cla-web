import apiInstance from "@/api/authConfig";
import axios, { AxiosInstance } from "axios";
import { print } from "graphql";
import type { DocumentNode } from "graphql";

type GraphQLSuccess<T> = { data: T; errors?: never };
type GraphQLErrorPayload = { errors: unknown[]; data?: unknown };

function hasErrors(payload: any): payload is GraphQLErrorPayload {
  return !!payload && Array.isArray(payload.errors) && payload.errors.length > 0;
}

export async function graphqlRequest<TData, TVariables = any>(
  document: DocumentNode,
  variables?: TVariables,
  instance: AxiosInstance = apiInstance,
): Promise<GraphQLSuccess<TData>> {
  const response = await instance.post("/graphql", {
    query: print(document),
    variables,
  });

  if (hasErrors(response.data)) {
    console.error("GraphQL request errors:", JSON.stringify(response.data.errors, null, 2));
    throw new Error("GraphQL request failed");
  }

  return response.data as GraphQLSuccess<TData>;
}

export async function graphqlRequestSystem<TData, TVariables = any>(
  document: DocumentNode,
  variables?: TVariables,
  instance: AxiosInstance = apiInstance,
): Promise<GraphQLSuccess<TData>> {
  const response = await instance.post("/graphql/system", {
    query: print(document),
    variables,
  });

  if (hasErrors(response.data)) {
    console.error("GraphQL system request errors:", JSON.stringify(response.data.errors, null, 2));
    throw new Error("GraphQL system request failed");
  }

  return response.data as GraphQLSuccess<TData>;
}

export async function graphqlRequestRaw<TData, TVariables = any>(
  query: string,
  variables?: TVariables,
  instance: AxiosInstance = apiInstance,
): Promise<GraphQLSuccess<TData>> {
  const response = await instance.post("/graphql", {
    query,
    variables,
  });

  if (hasErrors(response.data)) {
    console.error("GraphQL raw request errors:", JSON.stringify(response.data.errors, null, 2));
    throw new Error("GraphQL request failed");
  }

  return response.data as GraphQLSuccess<TData>;
}

export async function graphqlSystemRequest<TData, TVariables = any>(
  document: DocumentNode,
  variables: TVariables,
  url: string,
) {
  const response = await axios.post(
    url,
    {
      query: print(document),
      variables,
    },
    { headers: { "Content-Type": "application/json" } },
  );

  if (hasErrors(response.data)) {
    console.error("GraphQL system request errors:", JSON.stringify(response.data.errors, null, 2));
    throw new Error("GraphQL system request failed");
  }

  return response.data as GraphQLSuccess<TData>;
}
