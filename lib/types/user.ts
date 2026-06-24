export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  self_assessed_hsk_level?: string;
  topics_of_interest?: number[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  first_name: string;
  last_name: string;
}
