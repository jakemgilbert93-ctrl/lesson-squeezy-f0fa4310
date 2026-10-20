import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";

export const profileKey = (userId: string) => ["my-profile", userId] as const;

export function useMyProfile(userId: string) {
  const fetchProfile = useServerFn(getMyProfile);
  return useQuery({ queryKey: profileKey(userId), queryFn: () => fetchProfile() });
}