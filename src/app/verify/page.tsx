"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "No verification token provided."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
      redirect: "manual",
    })
      .then((res) => {
        if (res.type === "opaqueredirect" || res.status === 0 || (res.status >= 300 && res.status < 400)) {
          setStatus("success");
        } else if (res.ok) {
          setStatus("success");
        } else {
          return res.json().then((data) => {
            setStatus("error");
            setErrorMessage(data.error || "Verification failed.");
          });
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="w-full max-w-sm text-center">
      {status === "loading" && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            Verifying your email...
          </h1>
          <p className="text-gray-500 mt-2">Please wait.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Email verified
          </h1>
          <p className="text-gray-500 mt-2 mb-6">
            Your email has been verified.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Go to Admin Dashboard
            </Link>
            <Link
              href="/staff"
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Go to Staff Portal
            </Link>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Verification failed
          </h1>
          <p className="text-gray-500 mt-2 mb-6">{errorMessage}</p>
          <Link
            href="/admin/login"
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Verifying your email...
            </h1>
            <p className="text-gray-500 mt-2">Please wait.</p>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
