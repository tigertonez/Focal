// src/components/print/StaticProgress.tsx
export function StaticProgress({ value, indicatorClassName }: { value: number, indicatorClassName?: string }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div style={{ height: 8, borderRadius: 999, backgroundColor: '#E5E7EB' }}>
      <div 
        className={indicatorClassName}
        style={{ 
            width: `${v}%`, 
            height: 8, 
            borderRadius: 999, 
            background: indicatorClassName ? undefined : '#324E98'
        }} 
      />
    </div>
  );
}
