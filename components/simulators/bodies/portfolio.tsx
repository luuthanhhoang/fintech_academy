'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'
import { parsePriceCsv } from '@/lib/finance/csv'
import {
  analyticFrontier, annualize, covarianceMatrix, meanOf, minimumVariance, portfolioStats, randomPortfolios, sharpe, simpleReturns, syntheticReturns, upperEnvelope,
} from '@/lib/finance/portfolio'
import { fmtNum, fmtPct } from '@/lib/util/format'
import { RiskReturnChart } from '@/components/charts/scatter-chart'
import { SyntheticBadge } from '@/components/ui/badges'
import { ErrorState } from '@/components/ui/states'
import { Stat, StatGrid, Warning } from '../stat'
import type { SimBodyProps } from '../types'

const ConfigSchema = z.object({
  periodsPerYear: z.number().positive(),
  randomPortfolios: z.number().int().positive(),
  assets: z.array(z.object({ name: z.string(), muPct: z.number(), sigmaPct: z.number().positive() })).min(2),
  csvPlaceholder: z.string(),
})

interface Dataset {
  names: string[]
  returns: number[][]
  source: 'synthetic' | 'user'
}

export function PortfolioSim({ meta, values, syntheticLabel }: SimBodyProps) {
  const cfg = ConfigSchema.safeParse(meta.config)
  const [csv, setCsv] = useState('')
  const [csvError, setCsvError] = useState<string | null>(null)
  const [user, setUser] = useState<Dataset | null>(null)

  const synthetic = useMemo<Dataset | null>(() => {
    if (!cfg.success) return null
    const assets = cfg.data.assets.map((a) => ({ name: a.name, mu: a.muPct / 100, sigma: a.sigmaPct / 100 }))
    const r = syntheticReturns(assets, values.rho ?? 0, Math.max(3, Math.round(values.periods ?? 60)), Math.round(values.seed ?? 1))
    return r ? { names: assets.map((a) => a.name), returns: r, source: 'synthetic' } : null
  }, [cfg.success, cfg.data, values.rho, values.periods, values.seed])

  if (!cfg.success) return <ErrorState title="Cấu hình mô phỏng không hợp lệ" error={cfg.error.message} />
  const data = user ?? synthetic
  const rf = (values.riskFreePct ?? 0) / 100

  const loadCsv = () => {
    const parsed = parsePriceCsv(csv)
    if (!parsed.ok) return setCsvError(parsed.error)
    setCsvError(null)
    setUser({ names: parsed.table.assets, returns: parsed.table.prices.map(simpleReturns), source: 'user' })
  }

  const stats = data ? computeStats(data, cfg.data.periodsPerYear, cfg.data.randomPortfolios, Math.round(values.seed ?? 1)) : null
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        {data?.source === 'synthetic' ? <SyntheticBadge label={syntheticLabel} note={meta.syntheticNote} /> : <span className="rounded border border-accent px-1.5 py-0.5 text-xs text-accent">Dữ liệu của bạn (CSV)</span>}
        {user && (
          <button type="button" className="text-xs underline" onClick={() => setUser(null)}>
            Quay lại dữ liệu tổng hợp
          </button>
        )}
      </div>
      {!data && <Warning>Không tạo được dữ liệu: ma trận hiệp phương sai không xác định dương (ví dụ ρ = −1 với hơn 2 tài sản là bất khả thi).</Warning>}
      {stats && 'error' in stats && <Warning>{stats.error}</Warning>}
      {stats && !('error' in stats) && (
        <>
          <StatGrid>
            {stats.assets.map((a) => (
              <Stat key={a.name} label={a.name} value={`${fmtPct(a.ret, 1)} / σ ${fmtPct(a.vol, 1)}`} />
            ))}
            <Stat label="Danh mục rủi ro thấp nhất" value={`σ ${fmtPct(stats.minVar?.vol, 2)}`} hint={stats.minVar ? stats.minVar.weights.map((w, i) => `${data?.names[i]} ${fmtPct(w, 0)}`).join(', ') : undefined} />
            <Stat label="Sharpe tốt nhất (long-only, mẫu ngẫu nhiên)" value={fmtNum(stats.bestSharpe, 2)} />
          </StatGrid>
          <RiskReturnChart
            series={[
              { key: 'cloud', label: 'Danh mục ngẫu nhiên (chỉ mua)', slot: 4, points: stats.cloud },
              { key: 'frontier', label: 'Đường biên (cho phép bán khống)', slot: 1, points: stats.frontier, line: true },
              { key: 'envelope', label: 'Biên hiệu quả chỉ mua', slot: 3, points: stats.envelope, line: true },
              { key: 'assets', label: 'Tài sản đơn lẻ', slot: 2, points: stats.assets.map((a) => ({ x: a.vol, y: a.ret, name: a.name })) },
            ]}
          />
        </>
      )}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-2">Dán CSV giá của bạn</summary>
        <p className="mt-2 text-xs text-ink-3">Dòng đầu là tên tài sản (cột ngày tuỳ chọn). Mỗi dòng sau là giá cuối kỳ; lợi suất tính từ giá. Kỳ được coi là {fmtNum(cfg.data.periodsPerYear, 0)} kỳ/năm khi quy đổi năm.</p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} placeholder={cfg.data.csvPlaceholder} aria-label="Dữ liệu CSV" className="num mt-2 w-full rounded-md border border-rule bg-paper p-2 text-xs" />
        {csvError && <p role="alert" className="text-xs text-bad">{csvError}</p>}
        <button type="button" onClick={loadCsv} className="mt-1 rounded-md border border-rule px-3 py-1 text-sm hover:bg-paper-2">
          Phân tích dữ liệu của tôi
        </button>
      </details>
      {stats && !('error' in stats) && <p className="mt-2 text-xs text-ink-3">Lãi suất phi rủi ro dùng cho Sharpe: {fmtPct(rf, 2)}.</p>}
    </div>
  )

  function computeStats(d: Dataset, periodsPerYear: number, count: number, seed: number) {
    const lengths = new Set(d.returns.map((r) => r.length))
    if (lengths.size !== 1 || (d.returns[0]?.length ?? 0) < 3) return { error: 'Cần ít nhất 3 kỳ lợi suất cho mỗi tài sản.' }
    const { mu, cov } = annualize(d.returns.map(meanOf), covarianceMatrix(d.returns), periodsPerYear)
    const frontier = analyticFrontier(mu, cov, 40)
    const cloud = randomPortfolios(mu, cov, count, seed)
    const mvWeights = minimumVariance(cov)
    const minVar = mvWeights ? { ...portfolioStats(mvWeights, mu, cov), weights: mvWeights } : null
    const best = Math.max(...cloud.map((p) => sharpe(p.ret, p.vol, rf) ?? -Infinity))
    return {
      assets: d.names.map((name, i) => ({ name, ret: mu[i] as number, vol: Math.sqrt(cov[i]?.[i] ?? 0) })),
      frontier: (frontier ?? []).map((p) => ({ x: p.vol, y: p.ret })),
      cloud: cloud.map((p) => ({ x: p.vol, y: p.ret })),
      envelope: upperEnvelope(cloud).map((p) => ({ x: p.vol, y: p.ret })),
      minVar,
      bestSharpe: Number.isFinite(best) ? best : null,
    }
  }
}
