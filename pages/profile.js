import { auth } from "../lib/firebase";
import { UserContext } from "../lib/context";
import { useRouter } from "next/router";
import Image from "next/image";
import { useContext } from "react";

export default function Enter(props) {
  const { user, username } = useContext(UserContext);
  const router = useRouter();

  return (
    <div>
      <div className="grid justify-items-center">
        <Image
          src="/Feed_Logo.svg"
          alt="Logo"
          width="100%"
          height="100%"
          className="mx-auto"
          onClick={() => router.push("/")}
        />
      </div>
      <div>
        {user && user.photoURL && (
          <div className="w-full text-center mt-16">
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
            <div className="font-semibold text-primary-300">@{username}</div>
          </div>
        )}
      </div>
      <button
        onClick={signOut}
        className="text-center w-full mt-32 text-primary-500 font-bold"
      >
        Sign Out
      </button>
    </div>
  );

  async function signOut() {
    await auth.signOut();
    router.push("/signin");
  }
}
