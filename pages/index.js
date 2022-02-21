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
const LIMIT = 1;

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
    <div className="h-screen ">
      <div className="flex flex-col h-full ">
        <div className="flex-initial  border-b border-grey-50 grid justify-items-center">
          <Image
            src="/Feed_Logo.svg"
            alt="Logo"
            width="100%"
            height="100%"
            className="mx-auto"
          />
        </div>
        <div className="flex-auto h-full overflow-hidden ">
          <div className="h-full grid grid-cols-[1fr,4fr]">
            {/* Left Panel */}
            <div className="border-r border-grey-50 grid grid-cols-1 h-full p-4 justify-items-center text-center">
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
                    <div className="font-bold text-lg">{user.displayName}</div>
                    <div className="font-semibold text-gray-300">
                      @{username}
                    </div>
                  </div>
                )}
              </div>
              <div className="self-end ">
                <button
                  onClick={signOut}
                  className="font-bold text-primary-500"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right Panel */}
            <div className="overflow-scroll will-change-scroll h-full py-8 px-36">
              <div className="pb-16">
                <NewPostCard />
              </div>
              <PostFeed posts={posts} />
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
    <div className="p-4 drop-shadow-md bg-white rounded">
      <div>Today&#39;s Post</div>
      <textarea
        id="comment"
        name="comment"
        rows={3}
        className="shadow-sm block w-full  sm:text-sm border border-gray-200  focus:outline-none rounded-md p-1"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="grid grid-cols-2">
        <div className="justify-self-start">12/140</div>
        <div className="justify-self-end">
          <button onClick={createPost} className="text-primary-500">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
