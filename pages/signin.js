import { auth, firestore, googleAuthProvider } from "../lib/firebase";
import { UserContext } from "../lib/context";
import { useEffect, useState, useCallback, useContext } from "react";
import { useRouter } from "next/router";
import debounce from "lodash.debounce";
import Image from "next/image";

export default function Home(props) {
  const { user, username } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (user && username) router.push("/");
  }, [user, username]);

  return (
    <div className="h-screen bg-primary-500 min-w-fit">
      <div className="flex flex-col h-full ">
        <div className="flex-initial p-4">
          <Image src="/Feed_Logo.svg" alt="Logo" width="100%" height="100%" />
        </div>
        <div className="flex-auto">
          <div className="grid items-center h-full">
            {user ? (
              !username ? (
                <UsernameForm />
              ) : (
                <AlreadySignedIn />
              )
            ) : (
              <SignInForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlreadySignedIn() {
  const router = useRouter();

  return (
    <div className="text-center">
      <div className="text-7xl font-extrabold text-bone-500">
        You are already logged in
      </div>
      <div className="grid grid-cols-2 w-max mx-auto mt-8">
        <div>
          <button
            onClick={() => router.push("/")}
            className="bg-bone-500 inline-flex items-center px-4 py-2  text-base font-medium rounded-md shadow-sm text-primary-600 "
          >
            Go To Feed
          </button>
        </div>
        <button className="text-bone-500" onClick={() => auth.signOut()}>
          Log out
        </button>
      </div>
    </div>
  );
}

function SignInForm() {
  const signInWithGoogle = async () => {
    await auth.signInWithPopup(googleAuthProvider);
  };

  return (
    <div className="mx-auto w-max text-center text-bone-500 p-4">
      <div className="text-3xl md:text-5xl lg:text-7xl font-extrabold">
        Put your thoughts to the test
      </div>
      <div className="md:text-lg font-medium  lg:mt-4 ">
        Post today. Come back tomorrow and see how it did.
      </div>
      <div className="mt-16">
        <button
          onClick={signInWithGoogle}
          type="button"
          className="bg-white grid grid-cols-[auto,auto] gap-4 mx-auto items-center px-4 py-2 border text-base font-medium rounded-md shadow-sm text-gray-500 "
        >
          <Image src="/google.png" alt="Google" width="30px" height="30px" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

// Username form
function UsernameForm() {
  const [formValue, setFormValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { user, username } = useContext(UserContext);

  const onSubmit = async (e) => {
    e.preventDefault();

    // Create refs for both documents
    const userDoc = firestore.doc(`users/${user.uid}`);
    const usernameDoc = firestore.doc(`usernames/${formValue}`);

    // Commit both docs together as a batch write.
    const batch = firestore.batch();
    batch.set(userDoc, {
      username: formValue,
      photoURL: user.photoURL,
      displayName: user.displayName,
    });
    batch.set(usernameDoc, { uid: user.uid });

    await batch.commit();

    router.push("/");
  };

  const onChange = (e) => {
    // Force form value typed in form to match correct format
    const val = e.target.value.toLowerCase();
    const re = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    // Only set form value if length is < 3 OR it passes regex
    if (val.length < 3) {
      setFormValue(val);
      setLoading(false);
      setIsValid(false);
    }

    if (re.test(val)) {
      setFormValue(val);
      setLoading(true);
      setIsValid(false);
    }
  };

  //

  useEffect(() => {
    checkUsername(formValue);
  }, [formValue]);

  // Hit the database for username match after each debounced change
  // useCallback is required for debounce to work
  const checkUsername = useCallback(
    debounce(async (username) => {
      if (username.length >= 3) {
        const ref = firestore.doc(`usernames/${username}`);
        const { exists } = await ref.get();
        console.log("Firestore read executed!");
        setIsValid(!exists);
        setLoading(false);
      }
    }, 500),
    []
  );

  return (
    <div className="w-11/12 sm:3/4 md:w-1/2 max-w-[600px] mx-auto">
      <form onSubmit={onSubmit}>
        <div className="text-primary-300 font-medium">Choose a username</div>
        <div>
          <div className="flex border-b border-white text-5xl">
            <span className="inline-flex items-center text-primary-300 ">
              @
            </span>
            <input
              name="username"
              value={formValue}
              onChange={onChange}
              type="text"
              className="block w-full bg-primary-500 focus:outline-none text-bone-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2">
          <div className="font-thin text-sm text-bone-500 mt-1">
            <UsernameMessage
              username={formValue}
              isValid={isValid}
              loading={loading}
            />
          </div>
          <div className="font-thin text-sm text-bone-500 mt-1 text-right">
            <button
              type="submit"
              className="disabled:opacity-25"
              disabled={!isValid}
            >
              Done
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function UsernameMessage({ username, isValid, loading }) {
  if (loading) {
    return <p>Checking...</p>;
  } else if (isValid) {
    return <p className="text-success">{username} is available!</p>;
  } else if (username && !isValid) {
    return <p className="text-danger">That username is taken!</p>;
  } else {
    return <p></p>;
  }
}
