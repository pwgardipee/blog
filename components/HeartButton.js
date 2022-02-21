import { firestore, auth, increment } from "../lib/firebase";
import { useDocument } from "react-firebase-hooks/firestore";

// Allows user to heart or like a post
export default function Heart({ post }) {
  // Listen to heart document for currently logged in user

  const postRef = firestore
    .collection("users")
    .doc(post.uid)
    .collection("posts")
    .doc(post.id);
  const heartRef = postRef.collection("hearts").doc(auth?.currentUser?.uid);
  const [heartDoc] = useDocument(heartRef);

  // Create a user-to-post relationship
  const addHeart = async () => {
    const uid = auth.currentUser.uid;
    const batch = firestore.batch();

    batch.update(postRef, { heartCount: increment(1) });
    batch.set(heartRef, { uid });

    await batch.commit();
  };

  // Remove a user-to-post relationship
  const removeHeart = async () => {
    const batch = firestore.batch();

    batch.update(postRef, { heartCount: increment(-1) });
    batch.delete(heartRef);

    await batch.commit();
  };

  return (
    <button
      onClick={heartDoc?.exists ? removeHeart : addHeart}
      className="text-primary-500"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill={heartDoc?.exists ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
