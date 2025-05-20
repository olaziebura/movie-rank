import { getProfile, updateProfile } from "./profiles";

export async function addMovieToWishlist(userId: string, movieId: number) {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("Profile not found");

  const currentWishlist = profile.wishlist || [];
  if (!currentWishlist.includes(movieId)) {
    currentWishlist.push(movieId);
  }

  await updateProfile(userId, { ...profile, wishlist: currentWishlist });
  return currentWishlist;
}

export async function removeMovieFromWishlist(userId: string, movieId: number) {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("Profile not found");

  const currentWishlist = profile.wishlist || [];
  const updatedWishlist = currentWishlist.filter(
    (id: string) => id !== movieId.toString()
  );

  await updateProfile(userId, { ...profile, wishlist: updatedWishlist });
  return updatedWishlist;
}
