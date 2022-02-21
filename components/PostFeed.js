import HeartButton from "./HeartButton";
import moment from "moment";
export default function PostFeed({ posts }) {
  return (
    <div className="grid gap-4">
      {posts
        ? posts.map((post) => <PostItem post={post} key={post.id} />)
        : null}
    </div>
  );
}

function PostItem({ post }) {
  const createdAt =
    typeof post?.createdAt === "number"
      ? new Date(post.createdAt)
      : post.createdAt.toDate();
  return (
    <div className="border-b border-gray-100 bg-white py-4">
      <div className="grid grid-cols-[auto,100px] gap-8">
        <div>
          <div className="text-xl break-all">{post.content}</div>
          <div className="font-medium text-sm text-gray-300 mt-2">
            {moment(createdAt).fromNow()}
          </div>
        </div>
        <div className="self-center justify-self-center">
          <HeartButton post={post} />
        </div>
      </div>
    </div>
  );
}
