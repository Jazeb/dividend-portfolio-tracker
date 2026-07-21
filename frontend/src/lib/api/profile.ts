// Profile API service.
//   GET  /profile        -> Profile
//   PUT  /profile        -> Profile

import { http } from "@/lib/http";

export interface Profile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
}

export type UpdateProfileDto = Omit<Profile, "id">;

export const profileApi = {
  get: () => http.get<Profile>("/profile"),
  update: (dto: UpdateProfileDto) => http.put<Profile>("/profile", dto),
};
