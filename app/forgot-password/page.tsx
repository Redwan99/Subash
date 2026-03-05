import { Suspense } from "react";
import ForgotPasswordPage from "./ForgotPasswordClient";

export const metadata = {
  title: "Forgot Password",
  description: "Reset your Subash password",
};

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordPage />
    </Suspense>
  );
}