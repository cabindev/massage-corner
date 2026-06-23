import type { Metadata } from "next";
import { Suspense } from "react";
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign In | Massage Corner Sofia",
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
