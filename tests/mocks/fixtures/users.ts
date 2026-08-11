export const TEST_USER = {
  id: "user-001",
  email: "test@example.com",
  first_name: "Nguyễn",
  last_name: "Văn A",
  avatar: null,
  role: "agency_sales",
};

export const TEST_PROFILE = {
  id: "profile-001",
  user_id: TEST_USER.id,
  full_name: "Nguyễn Văn A",
  phone: "0901234567",
};

export const TEST_TOKENS = {
  access_token: "test-access-token-123",
  refresh_token: "test-refresh-token-456",
  expires: 900,
};

export const AUTH_LOGIN_RESPONSE = {
  data: {
    ...TEST_TOKENS,
    user: TEST_USER,
  },
};

export const REFRESH_TOKENS_RESPONSE = {
  data: {
    auth_refresh: {
      access_token: "new-access-token-789",
      refresh_token: "new-refresh-token-000",
      expires: 900,
    },
  },
};
