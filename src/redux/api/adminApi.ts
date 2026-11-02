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
  isDisabled: boolean;
  dateJoined: string;
  lastLogin: string | null;
  playersCount: number;
  booksCount: number;
}

/** Fields the panel may edit. All optional — only what's sent gets written. */
export interface UpdateUserPatch {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  isActive?: boolean;
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
              isDisabled
              dateJoined
              lastLogin
              playersCount
              booksCount
            }
          }
        `,
      }),
      transformResponse: (response: { users: AdminUser[] }) => response.users,
      providesTags: ["User"],
    }),

    updateUser: builder.mutation<AdminUser, UpdateUserPatch>({
      query: ({ id, ...patch }) => ({
        query: `
          mutation UpdateUser(
            $id: ID!
            $firstName: String
            $lastName: String
            $email: String
            $username: String
            $isActive: Boolean
          ) {
            updateUser(
              id: $id
              firstName: $firstName
              lastName: $lastName
              email: $email
              username: $username
              isActive: $isActive
            ) {
              user { id username email firstName lastName isActive isDisabled }
            }
          }
        `,
        // Only the keys actually present are forwarded, so an untouched field
        // stays untouched server-side rather than being overwritten with a
        // stale value read at the time the form opened.
        variables: { id, ...patch },
      }),
      transformResponse: (r: { updateUser: { user: AdminUser } }) => r.updateUser.user,
      invalidatesTags: ["User"],
    }),

    setUserDisabled: builder.mutation<AdminUser, { id: string; disabled: boolean }>({
      query: ({ id, disabled }) => ({
        query: `
          mutation SetUserDisabled($id: ID!, $disabled: Boolean!) {
            setUserDisabled(id: $id, disabled: $disabled) {
              user { id isDisabled }
            }
          }
        `,
        variables: { id, disabled },
      }),
      transformResponse: (r: { setUserDisabled: { user: AdminUser } }) => r.setUserDisabled.user,
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation<{ deletedId: string }, { id: string; expectedUsername: string }>({
      query: ({ id, expectedUsername }) => ({
        query: `
          mutation DeleteUser($id: ID!, $expectedUsername: String!) {
            deleteUser(id: $id, expectedUsername: $expectedUsername) {
              deletedId
              deletedUsername
            }
          }
        `,
        variables: { id, expectedUsername },
      }),
      transformResponse: (r: { deleteUser: { deletedId: string } }) => r.deleteUser,
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserMutation,
  useSetUserDisabledMutation,
  useDeleteUserMutation,
} = adminApi;

/**
 * True while any query or mutation is in flight.
 *
 * RTK Query already records every request's status in the store, so the global
 * loader can read that directly instead of the app maintaining its own request
 * counter (which is what chess-tracker-frontend's requestTracker has to do,
 * since it isn't on RTK Query).
 */
export const selectIsFetching = (state: {
  [adminApi.reducerPath]: ReturnType<typeof adminApi.reducer>;
}): boolean => {
  const slice = state[adminApi.reducerPath];
  const pending = (bag: Record<string, { status?: string } | undefined>) =>
    Object.values(bag).some((entry) => entry?.status === "pending");
  return pending(slice.queries) || pending(slice.mutations);
};
