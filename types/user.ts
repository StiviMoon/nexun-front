import { FieldValue, Timestamp } from "firebase/firestore";

export type FirestoreDate = FieldValue | Timestamp;

export type UserProfileDoc = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerIds: string[];
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};
