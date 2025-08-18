
export function StaticProgress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full bg-muted rounded-full">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
    </div>
  );
}
