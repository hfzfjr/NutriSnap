"use client";

import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  Smartphone,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
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
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [hasSubscription, setHasSubscription] = React.useState(false);
  const [reminderEnabled, setReminderEnabled] = React.useState(false);
  const [breakfastTime, setBreakfastTime] = React.useState("08:00");
  const [lunchTime, setLunchTime] = React.useState("13:00");
  const [dinnerTime, setDinnerTime] = React.useState("20:00");
  const [timezone, setTimezone] = React.useState("Asia/Jakarta");
  const [isBusy, setIsBusy] = React.useState(false);
  const [permissionState, setPermissionState] = React.useState<
    NotificationPermission | "unsupported"
  >("default");

  React.useEffect(() => {
    // Deteksi PWA Standalone
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsStandalone(standalone);

      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      } else {
        setPermissionState("unsupported");
      }

      // Deteksi timezone perangkat
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) setTimezone(detected);
      } catch {
        // default Asia/Jakarta
      }
      // Registrasi Service Worker segera
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    }

    // Ambil preferensi notifikasi dari backend
    void apiFetch<{
      subscription: {
        endpoint?: string;
        reminderEnabled: boolean;
        breakfastTime: string;
        lunchTime: string;
        dinnerTime: string;
      } | null;
    }>("/notifications/preferences")
      .then((res) => {
        if (res.subscription) {
          setHasSubscription(Boolean(res.subscription.endpoint));
          setReminderEnabled(res.subscription.reminderEnabled);
          setBreakfastTime(res.subscription.breakfastTime);
          setLunchTime(res.subscription.lunchTime);
          setDinnerTime(res.subscription.dinnerTime);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleReminder = async (checked: boolean) => {
    setReminderEnabled(checked);

    if (!checked) {
      // Nonaktifkan jadwal tanpa menghapus langganan
      setIsBusy(true);
      try {
        await apiFetch("/notifications/subscribe", {
          method: "POST",
          body: JSON.stringify({
            reminderEnabled: false,
            breakfastTime,
            lunchTime,
            dinnerTime,
          }),
        });
        toast.info("Pengingat makan harian dinonaktifkan.");
      } catch {
        toast.error("Gagal memperbarui status pengingat.");
      } finally {
        setIsBusy(false);
      }
      return;
    }

    // Mengaktifkan: Minta izin browser jika belum granted
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser ini tidak mendukung notifikasi push.");
      setReminderEnabled(false);
      return;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker tidak tersedia di browser ini.");
      setReminderEnabled(false);
      return;
    }

    setIsBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermissionState(perm);

      if (perm !== "granted") {
        toast.error(
          "Izin notifikasi ditolak. Aktifkan di pengaturan browser Anda."
        );
        setReminderEnabled(false);
        return;
      }

      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidRes = await apiFetch<{ publicKey: string }>(
        "/notifications/vapid-public-key"
      );

      if (!vapidRes.publicKey || !reg.pushManager) {
        throw new Error("Layanan push notification tidak didukung perangkat ini.");
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidRes.publicKey
        ) as unknown as BufferSource,
      });

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Gagal membuat langganan push yang valid.");
      }

      await apiFetch("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          reminderEnabled: true,
          breakfastTime,
          lunchTime,
          dinnerTime,
        }),
      });

      setHasSubscription(true);
      toast.success("Pengingat makan berhasil diaktifkan!");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mengaktifkan notifikasi push."
      );
      setReminderEnabled(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveTimes = async () => {
    setIsBusy(true);
    try {
      await apiFetch("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          reminderEnabled,
          breakfastTime,
          lunchTime,
          dinnerTime,
        }),
      });
      toast.success("Jadwal jam makan berhasil diperbarui.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan jadwal jam makan."
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
      toast.success(res.message || "Notifikasi pengujian telah dikirim!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memicu pengujian notifikasi."
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card id="pengingat" className="scroll-mt-20 rounded-2xl border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
              <Bell className="h-5 w-5 text-primary" />
              Pengingat Makan Harian
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Notifikasi push otomatis jika kamu belum mencatat sarapan, makan siang, atau makan malam.
            </CardDescription>
          </div>
          <div>
            <Badge
              variant={isStandalone ? "default" : "outline"}
              className="gap-1.5 py-1"
            >
              <Smartphone className="h-3.5 w-3.5" />
              {isStandalone ? "Aplikasi Terpasang" : "Web Browser"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Switch Pengaktif Utama */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3.5">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              Aktifkan Notifikasi Pengingat
            </p>
            <p className="text-[11px] text-muted-foreground">
              Kirimkan pengingat jika sesi makan belum tercatat hingga jam yang ditentukan.
            </p>
          </div>
          <Switch
            checked={reminderEnabled}
            onCheckedChange={(val) => void handleToggleReminder(val)}
            disabled={isBusy}
            aria-label="Aktifkan pengingat makan"
          />
        </div>

        {permissionState === "denied" && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Izin notifikasi ditolak oleh peramban. Silakan buka pengaturan izin situs pada browser Anda untuk mengizinkan notifikasi.
            </span>
          </div>
        )}

        {/* Zona Waktu & Jam Makan */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>Zona waktu pengingat:</span>
            <strong className="text-foreground">{timezone}</strong>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-3.5 py-2">
              <label
                htmlFor="time-breakfast"
                className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
              >
                <span className="text-sm">🍳</span>
                <span>Jam Sarapan</span>
              </label>
              <Input
                id="time-breakfast"
                type="time"
                value={breakfastTime}
                onChange={(e) => setBreakfastTime(e.target.value)}
                className="h-9 w-28 text-center text-sm font-semibold tabular-nums rounded-lg bg-background"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-3.5 py-2">
              <label
                htmlFor="time-lunch"
                className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
              >
                <span className="text-sm">🍲</span>
                <span>Jam Makan Siang</span>
              </label>
              <Input
                id="time-lunch"
                type="time"
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
                className="h-9 w-28 text-center text-sm font-semibold tabular-nums rounded-lg bg-background"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-3.5 py-2">
              <label
                htmlFor="time-dinner"
                className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
              >
                <span className="text-sm">🌙</span>
                <span>Jam Makan Malam</span>
              </label>
              <Input
                id="time-dinner"
                type="time"
                value={dinnerTime}
                onChange={(e) => setDinnerTime(e.target.value)}
                className="h-9 w-28 text-center text-sm font-semibold tabular-nums rounded-lg bg-background"
              />
            </div>
          </div>
        </div>

        {/* Tombol Aksi Simpan Jadwal & Uji Notifikasi */}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            type="button"
            onClick={() => void handleSaveTimes()}
            disabled={isBusy}
            className="flex-1 gap-2 min-h-[44px]"
          >
            <Clock className="h-4 w-4" />
            {isBusy ? "Menyimpan..." : "Simpan Jam Pengingat"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleTriggerTestNotification()}
            disabled={isBusy || !hasSubscription}
            className="min-h-[44px]"
            title={
              !hasSubscription
                ? "Aktifkan notifikasi terlebih dahulu untuk menguji"
                : undefined
            }
          >
            Uji Notifikasi
          </Button>
        </div>

        {/* Catatan Perangkat iOS */}
        <p className="text-[11px] text-muted-foreground">
          💡 <strong>Pengguna iPhone/iPad:</strong> Notifikasi web push memerlukan iOS 16.4+ dan aplikasi harus ditambahkan ke Layar Utama (*Add to Home Screen*) terlebih dahulu.
        </p>
      </CardContent>
    </Card>
  );
}
