import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Coins, Loader2, RefreshCw } from "lucide-react";

const inr = (n) =>
  n === null || n === undefined
    ? "—"
    : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}`;

const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

// Admin-only "AI credits" meter for the paid Gemini key. Google gives apps no
// way to read a prepaid balance, so this is an ESTIMATE: the balance the admin
// copies from Google's billing page, minus the estimated cost (token counts x
// published prices) of every paid import since. Re-entering Google's balance
// re-calibrates it at any time.
const AiUsagePanel = ({ refreshKey = 0 }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [lowInput, setLowInput] = useState("");

  const load = useCallback(async () => {
    try {
      const { data: res } = await axios.get(`${import.meta.env.VITE_APP_API_URL}/question-import/usage`);
      setData(res);
      setError(false);
    } catch (e) {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const save = async (body, okMessage) => {
    setSaving(true);
    try {
      const { data: res } = await axios.put(`${import.meta.env.VITE_APP_API_URL}/question-import/usage/settings`, body);
      setData(res);
      toast.success(okMessage);
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (error && !data) return null; // never get in the way of importing
  if (!data) return null;

  const pct = data.percentRemaining === null ? 0 : Math.max(0, Math.min(100, data.percentRemaining));
  const barColor = data.isLow ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="px-4 pt-3">
      <div className={`rounded-xl border px-3 py-2 ${data.isLow ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Coins className={`h-4 w-4 ${data.isLow ? "text-amber-600" : "text-gray-500"}`} />
          {data.configured ? (
            <>
              <span className="text-sm font-semibold text-gray-800">
                Paid AI credits left ≈ {inr(data.remainingInr)}
              </span>
              <span className="text-xs text-gray-500">
                used ≈ {inr(data.paid.spentInrSinceBaseline)} since {when(data.baselineAt)} · {data.paid.callsSinceBaseline} paid AI call
                {data.paid.callsSinceBaseline !== 1 ? "s" : ""}
                {data.callsLeftEstimate !== null ? ` · about ${data.callsLeftEstimate} more at this rate` : ""}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-700">
              Track your paid AI credits: enter your current balance from Google AI Studio → Billing.
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto text-xs text-purple-700 underline"
          >
            {open ? "Hide details" : data.configured ? "Details" : "Set up"}
          </button>
        </div>

        {data.configured && (
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden" title={`${pct}% of the starting balance`}>
            <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        {data.isLow && (
          <p className="mt-1.5 text-xs text-amber-800">
            Balance is at or below your alert level ({inr(data.lowBalanceInr)}). Buy more credits in Google AI Studio → Billing
            before the free key is the only one left.
          </p>
        )}

        {open && (
          <div className="mt-3 space-y-3 text-xs text-gray-700">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">My credit balance on Google right now (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="e.g. 412.50"
                  className="w-44 border border-gray-300 rounded-lg px-2 py-1"
                />
              </label>
              <button
                type="button"
                disabled={saving || balanceInput === ""}
                onClick={async () => {
                  if (await save({ remainingInr: balanceInput }, "Balance saved — the meter now counts from here.")) setBalanceInput("");
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-medium disabled:bg-gray-300 flex items-center gap-1"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {data.configured ? "Re-calibrate" : "Start tracking"}
              </button>
            </div>

            {data.configured && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white border border-gray-200 p-2">
                    <div className="text-gray-500">Starting balance</div>
                    <div className="font-semibold">{inr(data.baselineInr)}</div>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-2">
                    <div className="text-gray-500">Used since then (est.)</div>
                    <div className="font-semibold">{inr(data.paid.spentInrSinceBaseline)}</div>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-2">
                    <div className="text-gray-500">Average per paid call</div>
                    <div className="font-semibold">{inr(data.avgInrPerPaidCall)}</div>
                  </div>
                </div>

                {data.byModel.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Paid usage by model</div>
                    {data.byModel.map((m) => (
                      <div key={m.model} className="flex justify-between border-b border-gray-100 py-0.5">
                        <span>{m.model}</span>
                        <span>
                          {m.calls} call{m.calls !== 1 ? "s" : ""} · {m.inputTokens.toLocaleString("en-IN")} in /{" "}
                          {m.outputTokens.toLocaleString("en-IN")} out · {inr(m.costInr)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {data.recent.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Recent AI calls (free key calls cost ₹0)</div>
                    <div className="max-h-40 overflow-y-auto">
                      {data.recent.map((r, i) => (
                        <div key={i} className="flex flex-wrap justify-between gap-x-2 border-b border-gray-100 py-0.5">
                          <span>
                            {when(r.at)} · {r.key} · {r.source}
                          </span>
                          <span>
                            {r.inputTokens.toLocaleString("en-IN")} in / {r.outputTokens.toLocaleString("en-IN")} out ·{" "}
                            {r.key === "paid" ? inr(r.costInr) : "₹0"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">₹ per US$ (default {data.usdToInr})</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  placeholder={String(data.usdToInr)}
                  className="w-28 border border-gray-300 rounded-lg px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-gray-500">Warn me below (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={lowInput}
                  onChange={(e) => setLowInput(e.target.value)}
                  placeholder={String(data.lowBalanceInr)}
                  className="w-28 border border-gray-300 rounded-lg px-2 py-1"
                />
              </label>
              <button
                type="button"
                disabled={saving || (rateInput === "" && lowInput === "")}
                onClick={async () => {
                  const body = {};
                  if (rateInput !== "") body.usdToInr = rateInput;
                  if (lowInput !== "") body.lowBalanceInr = lowInput;
                  if (await save(body, "Settings saved.")) {
                    setRateInput("");
                    setLowInput("");
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-medium disabled:opacity-40"
              >
                Save
              </button>
            </div>

            {data.hasUnknownPrice && (
              <p className="text-amber-700">
                Some calls used a model with no known price, so they were priced like the main model.
              </p>
            )}
            <p className="text-gray-500">{data.note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiUsagePanel;
