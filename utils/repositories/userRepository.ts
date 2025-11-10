import { User } from "firebase/auth";
import { doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/utils/firabase";
import { UserProfileDoc } from "@/types/user";

const buildUserProfileData = (user: User): UserProfileDoc => {
  const providerIds = user.providerData
    .map((provider) => provider?.providerId)
    .filter((providerId): providerId is string => Boolean(providerId));

  const creationTime = user.metadata?.creationTime
    ? Timestamp.fromDate(new Date(user.metadata.creationTime))
    : serverTimestamp();

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    providerIds,
    createdAt: creationTime,
    updatedAt: serverTimestamp()
  };
};

export const saveUserProfile = async (user: User) => {
  const profileData = buildUserProfileData(user);
  const userDocRef = doc(firestore, "users", user.uid);

  await setDoc(userDocRef, profileData, { merge: true });
};
