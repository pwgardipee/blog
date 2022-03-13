import PostFeed from "../components/PostFeed";
import Loader from "../components/Loader";
import {
  firestore,
  fromMillis,
  postToJSON,
  auth,
  serverTimestamp,
} from "../lib/firebase";
import { UserContext } from "../lib/context";
import Image from "next/image";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

import { useState, useContext } from "react";

// Max post to query per page
const LIMIT = 20;

export async function getServerSideProps(context) {
  const postsQuery = firestore
    .collectionGroup("posts")
    .orderBy("createdAt", "desc")
    .limit(LIMIT);

  const posts = (await postsQuery.get()).docs.map(postToJSON);

  return {
    props: { posts }, // will be passed to the page component as props
  };
}

export default function Home(props) {
  const [posts, setPosts] = useState(props.posts);
  const [loading, setLoading] = useState(false);
  const { user, username } = useContext(UserContext);
  const router = useRouter();

  const [postsEnd, setPostsEnd] = useState(false);

  const getMorePosts = async () => {
    setLoading(true);
    const last = posts[posts.length - 1];

    if (!last) {
      setLoading(false);
      setPostsEnd(true);
      return;
    }

    const cursor =
      typeof last?.createdAt === "number"
        ? fromMillis(last?.createdAt)
        : last?.createdAt;

    const query = firestore
      .collectionGroup("posts")
      .orderBy("createdAt", "desc")
      .startAfter(cursor)
      .limit(LIMIT);

    const newPosts = (await query.get()).docs.map(postToJSON);

    setPosts(posts.concat(newPosts));
    setLoading(false);

    if (newPosts.length < LIMIT) {
      setPostsEnd(true);
    }
  };

  const signOut = async () => {
    await auth.signOut();
    router.push("/signin");
  };

  return (
    <div className="h-screen">
      <div className="flex flex-col h-full ">
        <div className="flex-initial border-b border-gray-700 grid  grid-cols-2 md:grid-cols-1 md:justify-items-center px-12">
          <div className="">
            <Image
              src="/Feed_Logo.svg"
              alt="Logo"
              width="100%"
              height="100%"
              className="mx-auto"
            />
          </div>
          <div className="md:hidden w-full grid justify-items-end items-center">
            {username ? (
              <div className="w-16 h-16">
                <Image
                  src={user?.photoURL}
                  alt={username}
                  width="100%"
                  height="100%"
                  className="rounded-full"
                  onClick={() => router.push("/profile")}
                />
              </div>
            ) : (
              <button
                onClick={() => router.push("/signin")}
                className="font-bold text-primary-500"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        <div className="flex-auto h-full overflow-hidden ">
          <div className="h-full md:grid grid-cols-[250px,auto]">
            {/* Left Panel */}
            <div className="border-r border-gray-700 grid-cols-1 h-full p-4 justify-items-center text-center hidden md:grid">
              <div>
                {user && user.photoURL && (
                  <div>
                    <Image
                      src={user?.photoURL}
                      alt={username}
                      width="100%"
                      height="100%"
                      className="rounded-full"
                    />
                    <div className="font-bold text-lg text-bone-500">
                      {user.displayName}
                    </div>
                    <div className="font-semibold text-primary-300">
                      @{username}
                    </div>
                  </div>
                )}
              </div>
              <div className="self-end ">
                {username ? (
                  <button
                    onClick={signOut}
                    className="font-bold text-primary-500"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/signin")}
                    className="font-bold text-primary-500"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="overflow-scroll will-change-scroll h-full ">
              <div className="py-8 mx-auto w-11/12 md:w-3/4">
                <div className="mb-16">
                  <NewPostCard />
                </div>
                <PostFeed posts={posts} />
              </div>
              {!loading && !postsEnd && (
                <button onClick={getMorePosts}>Load more</button>
              )}

              <Loader show={loading} />

              {postsEnd && "You have reached the end!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewPostCard() {
  const [content, setContent] = useState("");
  const { username } = useContext(UserContext);
  const [isValid, setIsValid] = useState(false);

  const createPost = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser.uid;

    // Tip: give all fields a default value here
    const data = {
      uid,
      username,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      heartCount: 0,
    };

    await firestore.collection("users").doc(uid).collection("posts").add(data);

    setContent("");

    toast.success("Post created!");
  };

  return (
    <div className="p-4 rounded-t-lg background-gradient">
      <form onSubmit={createPost}>
        <div className="grid grid-cols-[1fr,auto] gap-12 items-center ">
          <textarea
            name="username"
            value={content}
            onChange={(e) => {
              const content = e.target.value;
              setContent(content);
              setIsValid(content && content.length);
            }}
            type="text"
            className="block w-full bg-transparent focus:outline-none text-bone-500 placeholder:text-primary-300 resize-none text-3xl"
            rows="3"
            placeholder="Today's Post..."
          />

          <button
            type="submit"
            className="disabled:opacity-25 font-black text-lg text-bone-500 mt-1 text-right"
            disabled={!isValid}
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
