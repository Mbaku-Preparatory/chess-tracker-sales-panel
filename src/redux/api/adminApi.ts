import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { getToken } from "@clerk/nextjs";

interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
}

interface GraphQLErrorPayload {
  message: string;
}

interface GraphQLResponseBody<T> {
  data?: T;
  errors?: GraphQLErrorPayload[];
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_URL ?? "http://localhost:8000/admin-graphql/",
  prepareHeaders: async (headers) => {
    const token = await getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const graphqlBaseQuery: BaseQueryFn<GraphQLRequest, unknown, GraphQLErrorPayload[]> = async (
  { query, variables },
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(
    { url: "", method: "POST", body: { query, variables } },
    api,
    extraOptions
  );

  if (result.error) {
    return { error: [{ message: `Request failed (${result.error.status})` }] };
  }

  const body = result.data as GraphQLResponseBody<unknown>;
  if (body.errors?.length) {
    return { error: body.errors };
  }
  return { data: body.data };
};

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  dateJoined: string;
  lastLogin: string | null;
  playersCount: number;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: graphqlBaseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query<AdminUser[], void>({
      query: () => ({
        query: `
          query AdminUsers {
            users {
              id
              username
              email
              firstName
              lastName
              isActive
              dateJoined
              lastLogin
              playersCount
            }
          }
        `,
      }),
      transformResponse: (response: { users: AdminUser[] }) => response.users,
      providesTags: ["User"],
    }),
  }),
});

export const { useGetUsersQuery } = adminApi;
