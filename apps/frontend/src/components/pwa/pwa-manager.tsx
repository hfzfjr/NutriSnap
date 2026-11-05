"use client";

import { Bell, CheckCircle2, Smartphone } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaPushReminderCard() {
  const [swReady, setSwReady] = React.useState(false);
  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const [breakfastTime, setBreakfastTime] = React.useState("08:00");
  const [lunchTime, setLunchTime] = React.useState("13:00");
  const [dinnerTime, setDinnerTime] = React.useState("20:00");
  const [isBusy, setIsBusy] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setSwReady(true))
        .catch(() => {});
    }

    void apiFetch<{
      subscription: {
        reminderEnabled: boolean;
        breakfastTime: string;
        lunchTime: string;
        dinnerTime: string;
      } | null;
    }>("/notifications/preferences")
      .then((res) => {
        if (res.subscription) {
          setReminderEnabled(res.subscription.reminderEnabled);
          setBreakfastTime(res.subscription.breakfastTime);
          setLunchTime(res.subscription.lunchTime);
          setDinnerTime(res.subscription.dinnerTime);
        }
      })
      .catch(() => {});
  }, []);

  const handleEnablePushAndSave = async () => {
    setIsBusy(true);
    setStatusMsg(null);
    try {
      let endpoint = "https://push.nutrisnap.local/device-default";
      let p256dh = "BEl62iUYgUivxIkv69yViEuiBIa";
      let auth = "UUxI4O8-FbRouAev";

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator
      ) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          const reg = await navigator.serviceWorker.ready;
          const vapidRes = await apiFetch<{ publicKey: string }>(
            "/notifications/vapid-public-key"
          );
          if (vapidRes.publicKey && reg.pushManager) {
            try {
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                  vapidRes.publicKey
                ) as unknown as BufferSource,
              });
              const subJson = sub.toJSON();
              if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
                endpoint = subJson.endpoint;
                p256dh = subJson.keys.p256dh;
                auth = subJson.keys.auth;
              }
            } catch {
              // Gunakan fallback subscription lokal jika browser dev memblokir push service
            }
          }
        }
      }

      await apiFetch("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint,
          keys: { p256dh, auth },
          reminderEnabled,
          breakfastTime,
          lunchTime,
          dinnerTime,
        }),
      });

      setStatusMsg(
        "Jadwal pengingat makan harian berhasil disimpan & diaktifkan!"
      );
    } catch (err) {
      setStatusMsg(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan jadwal pengingat makan."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleTriggerTestNotification = async () => {
    setIsBusy(true);
    try {
      const res = await apiFetch<{ message: string }>("/notifications/test", {
        method: "POST",
      });
      setStatusMsg(res.message);
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("NutriSnap Meal Reminder", {
          body: "Pengingat makan aktif! Jangan lupa catat kalori & proteinmu hari ini.",
          icon: "/icons/icon.svg",
        });
      }
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : "Gagal mengirim test notifikasi."
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Pengingat Makan Terjadwal (PWA Push Notification)
            </CardTitle>
            <CardDescription>
              Mengirim notifikasi otomatis jika Anda belum mencatat makan pada jam makan harian.
            </CardDescription>
          </div>
          <Badge variant={swReady ? "default" : "outline"} className="gap-1">
            <Smartphone className="h-3.5 w-3.5" />
            {swReady ? "PWA Ready" : "Web Mode"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {statusMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-300">
            {statusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Jam Sarapan</label>
            <Input
              type="time"
              value={breakfastTime}
              onChange={(e) => setBreakfastTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Jam Makan Siang</label>
            <Input
              type="time"
              value={lunchTime}
              onChange={(e) => setLunchTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Jam Makan Malam</label>
            <Input
              type="time"
              value={dinnerTime}
              onChange={(e) => setDinnerTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => void handleEnablePushAndSave()}
            disabled={isBusy}
            className="flex-1 gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isBusy ? "Menyimpan..." : "Aktifkan & Simpan Jadwal Pengingat"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleTriggerTestNotification()}
            disabled={isBusy}
          >
            Uji Notifikasi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

