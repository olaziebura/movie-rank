export type UserProfile = {
  id: string;
  name: string;
  email: string;
  profile_image_url?: string;
  wishlist: number[];
  admin?: boolean;
  created_at?: string;
  updated_at?: string;
};
