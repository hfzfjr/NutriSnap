export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="mt-3 text-xs text-muted-foreground animate-pulse">
        Memuat NutriSnap...
      </p>
    </div>
  );
}

