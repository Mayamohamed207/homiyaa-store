import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface UsageRow {
  metric: string;
  used: string;
  free_limit: string;
  percent_used: number;
}

const AdminUsagePanel = () => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchUsage = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_homiyaa_usage');
    if (!error && data) {
      setRows(data);
      setLastRefreshed(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const getBarColor = (pct: number) => {
    if (pct >= 85) return '#ef4444';
    if (pct >= 60) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-900)' }}>
            {t('Supabase Free Tier Usage', 'استخدام الخطة المجانية')}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--primary-500)' }}>
            {lastRefreshed
              ? `${t('Last updated', 'آخر تحديث')}: ${lastRefreshed.toLocaleTimeString('en-GB')}`
              : t('Loading...', 'جاري التحميل...')}
          </p>
        </div>
        <button
          onClick={fetchUsage}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
            borderRadius: '8px', padding: '0.5rem 1rem',
            fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-800)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {t('Refresh', 'تحديث')}
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary-400)' }}>
          {t('Loading usage data...', 'جاري تحميل البيانات...')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((row) => {
            const pct = Math.min(Number(row.percent_used), 100);
            const barColor = getBarColor(pct);
            const isUnlimited = row.free_limit === 'unlimited';

            return (
              <div
                key={row.metric}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--primary-100)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary-900)' }}>
                      {row.metric}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary-500)', marginTop: '2px' }}>
                      {t('Limit', 'الحد')}: {row.free_limit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 800, fontSize: '1rem',
                      color: isUnlimited ? 'var(--primary-700)' : barColor,
                    }}>
                      {row.used}
                    </span>
                    {!isUnlimited && (
                      <div style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: barColor, marginTop: '2px',
                      }}>
                        {pct}%
                      </div>
                    )}
                  </div>
                </div>

                {!isUnlimited && (
                  <div style={{
                    width: '100%', height: '7px',
                    background: 'var(--primary-100)',
                    borderRadius: '10px', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: '10px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                )}

                {!isUnlimited && pct >= 80 && (
                  <div style={{
                    marginTop: '0.5rem', fontSize: '0.75rem',
                    color: pct >= 85 ? '#ef4444' : '#f59e0b',
                    fontWeight: 600,
                  }}>
                    ⚠️ {pct >= 85
                      ? t('Critical — approaching limit!', 'تحذير: أنت قريب من الحد الأقصى!')
                      : t('Warning — usage is getting high.', 'تنبيه: الاستخدام مرتفع.')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUsagePanel;