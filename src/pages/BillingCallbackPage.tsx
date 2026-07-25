import { useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifySubscriptionPayment } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUsage } = useAuth();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    const token = localStorage.getItem("access_token") || "";
    if (!reference || !token) {
      setStatus("error");
      setMessage("We could not verify this payment. Please return to pricing and try again.");
      return;
    }

    verifySubscriptionPayment(token, reference)
      .then(async () => {
        await refreshUsage();
        setStatus("success");
        setMessage("Payment confirmed. Your plan is now active.");
        window.setTimeout(() => navigate("/pricing", { replace: true }), 1800);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Payment verification failed.");
      });
  }, [navigate, params, refreshUsage]);

  return (
    <main className="min-h-screen bg-[var(--bg)] grid place-items-center p-6">
      <section className="w-full max-w-md rounded-lg border bg-[var(--surface)] p-8 text-center">
        {status === "checking" && <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />}
        {status === "success" && <CheckCircle className="mx-auto mb-4 h-8 w-8 text-emerald-700" />}
        {status === "error" && <XCircle className="mx-auto mb-4 h-8 w-8 text-red-600" />}
        <h1 className="mb-2 text-xl font-semibold">
          {status === "checking" ? "Verifying payment" : status === "success" ? "You’re all set" : "Verification problem"}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {status === "error" && (
          <button className="btn btn-primary mt-6" onClick={() => navigate("/pricing")}>
            Return to pricing
          </button>
        )}
      </section>
    </main>
  );
}
