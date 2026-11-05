import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";

import { ADMIN_GRAPHQL_URL } from "@/lib/config";
import { clearSession, readSession } from "@/lib/session";

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
  baseUrl: ADMIN_GRAPHQL_URL,
  prepareHeaders: (headers) => {
    const token = readSession()?.token;
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
    // 401: the session ended or was never valid. 403: the address is no longer
    // on the backend's allowlist. Either way it cannot be used again, and
    // dropping it sends AuthGate back to the sign-in page.
    if (result.error.status === 401 || result.error.status === 403) clearSession();
    return { error: [{ message: `Request failed (${result.error.status})` }] };
  }

  const body = result.data as GraphQLResponseBody<unknown>;
  if (body.errors?.length) {
    return { error: body.errors };
  }
  return { data: body.data };
};

export interface Money {
  currency: string;
  /** A decimal string, e.g. "350.00". */
  amount: string;
}

export interface Health {
  /** 0–10: payment 0–4 + tenure 0–2 + engagement 0–4. */
  score: number;
  label: "healthy" | "at_risk" | "churning";
  payment: number;
  tenure: number;
  engagement: number;
  lastActive: string | null;
}

export type SubscriptionStatus = "active" | "expiring" | "lapsed" | "churned" | "never";
export type FunnelStage = "signed_up" | "verified" | "added_player" | "subscribed" | "renewed";

export interface SubscriptionSummary {
  status: SubscriptionStatus;
  paidUntil: string | null;
  currentPlan: string | null;
  lifetimePaid: Money[];
  paidGrants: number;
  priceGroup: string;
  customPrice: string | null;
  customCurrency: string;
  foundingMember: boolean;
  termsNote: string;
  health: Health | null;
  funnelStage: FunnelStage;
}

export interface Grant {
  id: string;
  source: "payment" | "manual_payment" | "complimentary" | "trial";
  sourceLabel: string;
  plan: { code: string; name: string } | null;
  days: number;
  amount: string;
  currency: string;
  reference: string;
  startsAt: string | null;
  endsAt: string | null;
  note: string;
  createdAt: string;
  createdBy: string;
  voidedAt: string | null;
  voidedBy: string;
  voidReason: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  priceGroup: "KE" | "A" | "B" | "C";
  days: number;
  price: string;
  currency: string;
  isOnSale: boolean;
  updatedAt: string;
}

export interface Overview {
  users: number;
  byStatus: { status: SubscriptionStatus; count: number }[];
  expiringSoon: number;
  newSubscribersThisMonth: number;
  revenueThisMonth: Money[];
  revenueAllTime: Money[];
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  targetLabel: string;
  targetUserId: string | null;
  /** JSON-encoded. */
  details: string;
  createdAt: string;
}

export interface GrantInput {
  userId: string;
  source: "manual_payment" | "complimentary" | "trial";
  days: number;
  amount?: string;
  currency?: string;
  planCode?: string | null;
  reference?: string;
  note?: string;
}

export interface TermsInput {
  userId: string;
  customPrice?: string;
  customCurrency?: string;
  clearCustomPrice?: boolean;
  foundingMember?: boolean;
  priceGroup?: string;
  termsNote?: string;
}

const SUBSCRIPTION_FIELDS = `
  subscription {
    status paidUntil currentPlan paidGrants priceGroup customPrice customCurrency
    foundingMember termsNote funnelStage
    lifetimePaid { currency amount }
    health { score label payment tenure engagement lastActive }
  }
`;

const USER_FIELDS = `
  id username email firstName lastName isActive isDisabled dateJoined lastLogin
  playersCount booksCount ${SUBSCRIPTION_FIELDS}
`;

const GRANT_FIELDS = `
  id source sourceLabel days amount currency reference startsAt endsAt note
  createdAt createdBy voidedAt voidedBy voidReason plan { code name }
`;

/** One slice of the users list, and how many match across every slice. */
export interface UsersPage {
  count: number;
  results: AdminUser[];
}

export interface UsersPageArgs {
  search: string;
  /** "", "paying", or a SubscriptionStatus. */
  status: string;
  offset: number;
  limit: number;
}

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
  subscription: SubscriptionSummary;
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
  tagTypes: ["User", "Grant", "Plan", "Overview", "Audit"],
  endpoints: (builder) => ({
    getUsersPage: builder.query<UsersPage, UsersPageArgs>({
      query: ({ search, status, offset, limit }) => ({
        query: `
          query UsersPage($search: String, $status: String, $offset: Int, $limit: Int) {
            usersPage(search: $search, status: $status, offset: $offset, limit: $limit) {
              count
              results { ${USER_FIELDS} }
            }
          }
        `,
        variables: { search, status, offset, limit },
      }),
      transformResponse: (response: { usersPage: UsersPage }) => response.usersPage,
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
      invalidatesTags: ["User", "Audit", "Overview"],
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
      invalidatesTags: ["User", "Audit", "Overview"],
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
      invalidatesTags: ["User", "Audit", "Overview"],
    }),

    getUser: builder.query<AdminUser | null, string>({
      query: (id) => ({
        query: `query AdminUser($id: ID!) { user(id: $id) { ${USER_FIELDS} } }`,
        variables: { id },
      }),
      transformResponse: (r: { user: AdminUser | null }) => r.user,
      providesTags: ["User"],
    }),

    getGrants: builder.query<Grant[], string>({
      query: (userId) => ({
        query: `query Grants($userId: ID!) { grants(userId: $userId) { ${GRANT_FIELDS} } }`,
        variables: { userId },
      }),
      transformResponse: (r: { grants: Grant[] }) => r.grants,
      providesTags: ["Grant"],
    }),

    getPlans: builder.query<Plan[], void>({
      query: () => ({
        query: `{ plans { id code name priceGroup days price currency isOnSale updatedAt } }`,
      }),
      transformResponse: (r: { plans: Plan[] }) => r.plans,
      providesTags: ["Plan"],
    }),

    getOverview: builder.query<Overview, void>({
      query: () => ({
        query: `{ overview {
          users expiringSoon newSubscribersThisMonth
          byStatus { status count }
          revenueThisMonth { currency amount }
          revenueAllTime { currency amount }
        } }`,
      }),
      transformResponse: (r: { overview: Overview }) => r.overview,
      providesTags: ["Overview"],
    }),

    getAuditTrail: builder.query<AuditEntry[], { userId?: string } | void>({
      query: (args) => ({
        query: `query Audit($userId: ID) { auditTrail(userId: $userId) {
          id actor action targetLabel targetUserId details createdAt
        } }`,
        variables: { userId: args?.userId ?? null },
      }),
      transformResponse: (r: { auditTrail: AuditEntry[] }) => r.auditTrail,
      providesTags: ["Audit"],
    }),

    grantAccess: builder.mutation<Grant, GrantInput>({
      query: (input) => ({
        query: `mutation GrantAccess(
          $userId: ID!, $source: String!, $days: Int!, $amount: Decimal, $currency: String,
          $planCode: String, $reference: String, $note: String
        ) {
          grantAccess(userId: $userId, source: $source, days: $days, amount: $amount,
                      currency: $currency, planCode: $planCode, reference: $reference, note: $note) {
            grant { ${GRANT_FIELDS} }
          }
        }`,
        variables: { ...input },
      }),
      transformResponse: (r: { grantAccess: { grant: Grant } }) => r.grantAccess.grant,
      invalidatesTags: ["User", "Grant", "Overview", "Audit"],
    }),

    voidGrant: builder.mutation<Grant, { grantId: string; reason: string }>({
      query: ({ grantId, reason }) => ({
        query: `mutation VoidGrant($grantId: ID!, $reason: String!) {
          voidGrant(grantId: $grantId, reason: $reason) { grant { ${GRANT_FIELDS} } }
        }`,
        variables: { grantId, reason },
      }),
      transformResponse: (r: { voidGrant: { grant: Grant } }) => r.voidGrant.grant,
      invalidatesTags: ["User", "Grant", "Overview", "Audit"],
    }),

    setSubscriptionTerms: builder.mutation<boolean, TermsInput>({
      query: (input) => ({
        query: `mutation Terms(
          $userId: ID!, $customPrice: Decimal, $customCurrency: String, $clearCustomPrice: Boolean,
          $foundingMember: Boolean, $priceGroup: String, $termsNote: String
        ) {
          setSubscriptionTerms(userId: $userId, customPrice: $customPrice, customCurrency: $customCurrency,
            clearCustomPrice: $clearCustomPrice, foundingMember: $foundingMember,
            priceGroup: $priceGroup, termsNote: $termsNote) { ok }
        }`,
        // Only the keys present are sent, so untouched terms stay untouched.
        variables: { ...input },
      }),
      transformResponse: (r: { setSubscriptionTerms: { ok: boolean } }) => r.setSubscriptionTerms.ok,
      invalidatesTags: ["User", "Audit"],
    }),

    updatePlan: builder.mutation<Plan, { code: string; price?: string; name?: string; days?: number; isOnSale?: boolean }>({
      query: (input) => ({
        query: `mutation UpdatePlan($code: String!, $price: Decimal, $name: String, $days: Int, $isOnSale: Boolean) {
          updatePlan(code: $code, price: $price, name: $name, days: $days, isOnSale: $isOnSale) {
            plan { id code name priceGroup days price currency isOnSale updatedAt }
          }
        }`,
        variables: { ...input },
      }),
      transformResponse: (r: { updatePlan: { plan: Plan } }) => r.updatePlan.plan,
      invalidatesTags: ["Plan", "Audit"],
    }),
  }),
});

export const {
  useGetUsersPageQuery,
  useUpdateUserMutation,
  useSetUserDisabledMutation,
  useDeleteUserMutation,
  useGetUserQuery,
  useGetGrantsQuery,
  useGetPlansQuery,
  useGetOverviewQuery,
  useGetAuditTrailQuery,
  useGrantAccessMutation,
  useVoidGrantMutation,
  useSetSubscriptionTermsMutation,
  useUpdatePlanMutation,
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
