import { useState } from "react";

const BUILD_TIME_OPTIONS = [10, 20, 30, 60];
const BUILDS_PER_DAY_OPTIONS = [1, 3, 5, 10];

const ON_DEMAND_HOURLY = 0.192;
const SPOT_HOURLY = 0.025;

const i18n = {
  ko: {
    title: "EC2 과금 모델 비교",
    subtitle: "m7i-flex.xlarge (4vCPU / 16GB) · 서울 리전 기준",
    buildTime: "빌드 소요 시간",
    buildTimeUnit: "분",
    buildsPerDay: "일 평균 빌드 횟수",
    buildsPerDayUnit: "회",
    note: "* 월 22 영업일 기준 · Spot 성공률 80% 가정",
    perMonth: "/월",
    extraCost: "※ Spot Only 대비 월 +{v} 추가",
    pros: "장점",
    cons: "단점",
    priceRef: "단가 참고",
    onDemandPrice: "On-Demand: $0.192/hr",
    spotPrice: "Spot: ~$0.025/hr (서울 리전 추정)",
    excludeIdle: "빌드 외 대기 시간 비용 미포함",
    models: [
      {
        id: "spot",
        label: "Spot Only",
        badge: "최저 비용",
        desc: "Spot 인스턴스만 사용. 가장 저렴하지만 AWS가 용량 회수 시 빌드 중단 위험.",
        pros: ["비용 최소화", "동일 스펙 대비 ~87% 절감"],
        cons: ["빌드 중단 가능성 (2분 전 알림)", "중단 시 처음부터 재시작", "긴 빌드일수록 위험"],
      },
      {
        id: "spot_fallback",
        label: "Spot + On-Demand 폴백",
        badge: "현재 권장",
        desc: "Spot 우선 시도 → 실패 시 On-Demand로 자동 전환. 안정성과 비용의 균형.",
        pros: ["Spot 성공 시 비용 절감", "중단 없이 빌드 보장", "AWS Auto Scaling 지원"],
        cons: ["구성 복잡도 증가", "폴백 시 On-Demand 요금 적용", "인프라 코드 관리 필요"],
      },
      {
        id: "ondemand",
        label: "On-Demand Only",
        badge: "가장 안정적",
        desc: "On-Demand 인스턴스만 사용. 중단 없이 안정적이며 설정이 가장 단순.",
        pros: ["중단 위험 없음", "설정 단순", "예측 가능한 비용"],
        cons: ["비용이 가장 높음", "유연성 낮음"],
      },
    ],
  },
  en: {
    title: "EC2 Billing Model Comparison",
    subtitle: "m7i-flex.xlarge (4vCPU / 16GB) · Seoul Region",
    buildTime: "Build Duration",
    buildTimeUnit: "min",
    buildsPerDay: "Avg. Builds per Day",
    buildsPerDayUnit: "",
    note: "* Based on 22 business days/month · Spot success rate 80%",
    perMonth: "/mo",
    extraCost: "※ +{v}/mo compared to Spot Only",
    pros: "Pros",
    cons: "Cons",
    priceRef: "Pricing Reference",
    onDemandPrice: "On-Demand: $0.192/hr",
    spotPrice: "Spot: ~$0.025/hr (Seoul region estimate)",
    excludeIdle: "Idle time between builds not included",
    models: [
      {
        id: "spot",
        label: "Spot Only",
        badge: "Lowest Cost",
        desc: "Uses only Spot instances. Cheapest option but risks build interruption if AWS reclaims capacity.",
        pros: ["Minimum cost", "~87% savings vs same spec On-Demand"],
        cons: ["Risk of interruption (2-min warning)", "Restart from scratch if interrupted", "Higher risk for longer builds"],
      },
      {
        id: "spot_fallback",
        label: "Spot + On-Demand Fallback",
        badge: "Recommended",
        desc: "Tries Spot first → automatically falls back to On-Demand on failure. Balances cost and stability.",
        pros: ["Cost savings when Spot succeeds", "No build interruptions", "AWS Auto Scaling supported"],
        cons: ["More complex setup", "On-Demand rates apply on fallback", "Requires pipeline management"],
      },
      {
        id: "ondemand",
        label: "On-Demand Only",
        badge: "Most Stable",
        desc: "Uses only On-Demand instances. Most stable with no interruption risk and simplest setup.",
        pros: ["No interruption risk", "Simple setup", "Predictable cost"],
        cons: ["Highest cost", "Less flexible"],
      },
    ],
  },
  ja: {
    title: "EC2 課金モデル比較",
    subtitle: "m7i-flex.xlarge (4vCPU / 16GB) · ソウルリージョン基準",
    buildTime: "ビルド所要時間",
    buildTimeUnit: "分",
    buildsPerDay: "1日平均ビルド回数",
    buildsPerDayUnit: "回",
    note: "* 月22営業日基準 · Spot成功率80%想定",
    perMonth: "/月",
    extraCost: "※ Spot Onlyと比較して月+{v}追加",
    pros: "メリット",
    cons: "デメリット",
    priceRef: "単価参考",
    onDemandPrice: "On-Demand: $0.192/hr",
    spotPrice: "Spot: ~$0.025/hr (ソウルリージョン推定)",
    excludeIdle: "ビルド外の待機時間コストは含まず",
    models: [
      {
        id: "spot",
        label: "Spot Only",
        badge: "最低コスト",
        desc: "Spotインスタンスのみ使用。最も安価ですが、AWSが容量を回収した場合にビルドが中断されるリスクがあります。",
        pros: ["コスト最小化", "同スペックOn-Demand比~87%削減"],
        cons: ["中断リスクあり（2分前に警告）", "中断時は最初からやり直し", "ビルド時間が長いほどリスク増加"],
      },
      {
        id: "spot_fallback",
        label: "Spot + On-Demand フォールバック",
        badge: "推奨",
        desc: "Spotを優先試行 → 失敗時にOn-Demandへ自動切替。コストと安定性のバランス。",
        pros: ["Spot成功時にコスト削減", "中断なしでビルド保証", "AWS Auto Scaling対応"],
        cons: ["設定の複雑さが増す", "フォールバック時はOn-Demand料金", "インフラコード管理が必要"],
      },
      {
        id: "ondemand",
        label: "On-Demand Only",
        badge: "最も安定",
        desc: "On-Demandインスタンスのみ使用。中断リスクなく安定しており、設定が最もシンプルです。",
        pros: ["中断リスクなし", "シンプルな設定", "予測可能なコスト"],
        cons: ["コストが最も高い", "柔軟性が低い"],
      },
    ],
  },
};

const MODEL_COLORS = [
  { badgeColor: "#16a34a", color: "#dcfce7", border: "#86efac" },
  { badgeColor: "#2563eb", color: "#dbeafe", border: "#93c5fd" },
  { badgeColor: "#9333ea", color: "#f3e8ff", border: "#d8b4fe" },
];

function calcCost(hourly, buildMins, buildsPerDay, days = 22) {
  return hourly * (buildMins / 60) * buildsPerDay * days;
}

function getCost(id, mins, perDay) {
  if (id === "spot") return calcCost(SPOT_HOURLY, mins, perDay);
  if (id === "spot_fallback") return calcCost(SPOT_HOURLY, mins, perDay) * 0.8 + calcCost(ON_DEMAND_HOURLY, mins, perDay) * 0.2;
  return calcCost(ON_DEMAND_HOURLY, mins, perDay);
}

const LANGS = ["ko", "en", "ja"];
const LANG_LABELS = { ko: "한국어", en: "English", ja: "日本語" };

export default function App() {
  const [buildMins, setBuildMins] = useState(30);
  const [buildsPerDay, setBuildsPerDay] = useState(3);
  const [lang, setLang] = useState("ko");

  const t = i18n[lang];
  const costs = t.models.map((m, i) => ({ ...m, ...MODEL_COLORS[i], cost: getCost(m.id, buildMins, buildsPerDay) }));
  const minCost = Math.min(...costs.map(c => c.cost));
  const maxCost = Math.max(...costs.map(c => c.cost));

  return (
      <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 780, margin: "0 auto", padding: "24px 16px", color: "#111" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t.title}</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {LANGS.map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: "4px 10px", borderRadius: 6, border: "1.5px solid",
                  borderColor: lang === l ? "#2563eb" : "#d1d5db",
                  background: lang === l ? "#2563eb" : "#fff",
                  color: lang === l ? "#fff" : "#374151",
                  fontWeight: 600, fontSize: 12, cursor: "pointer"
                }}>{LANG_LABELS[l]}</button>
            ))}
          </div>
        </div>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{t.subtitle}</p>

        {/* 파라미터 */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t.buildTime}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {BUILD_TIME_OPTIONS.map(v => (
                  <button key={v} onClick={() => setBuildMins(v)} style={{
                    padding: "5px 12px", borderRadius: 6, border: "1.5px solid",
                    borderColor: buildMins === v ? "#2563eb" : "#d1d5db",
                    background: buildMins === v ? "#2563eb" : "#fff",
                    color: buildMins === v ? "#fff" : "#374151",
                    fontWeight: 600, fontSize: 13, cursor: "pointer"
                  }}>{v}{t.buildTimeUnit}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t.buildsPerDay}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {BUILDS_PER_DAY_OPTIONS.map(v => (
                  <button key={v} onClick={() => setBuildsPerDay(v)} style={{
                    padding: "5px 12px", borderRadius: 6, border: "1.5px solid",
                    borderColor: buildsPerDay === v ? "#2563eb" : "#d1d5db",
                    background: buildsPerDay === v ? "#2563eb" : "#fff",
                    color: buildsPerDay === v ? "#fff" : "#374151",
                    fontWeight: 600, fontSize: 13, cursor: "pointer"
                  }}>{v}{t.buildsPerDayUnit}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", alignSelf: "flex-end", paddingBottom: 2 }}>{t.note}</div>
        </div>

        {/* 카드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {costs.map(m => {
            const pct = maxCost > 0 ? (m.cost / maxCost) * 100 : 0;
            const savings = m.cost - minCost;
            return (
                <div key={m.id} style={{ border: `1.5px solid ${m.border}`, borderRadius: 12, background: m.color, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{m.label}</span>
                    <span style={{ background: m.badgeColor, color: "#fff", borderRadius: 5, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>{m.badge}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 22, color: "#111" }}>
                  ${m.cost.toFixed(2)}<span style={{ fontSize: 13, fontWeight: 400, color: "#555" }}>{t.perMonth}</span>
                </span>
                  </div>
                  <div style={{ background: "#e5e7eb", borderRadius: 99, height: 8, marginBottom: 10 }}>
                    <div style={{ width: `${pct}%`, background: m.badgeColor, borderRadius: 99, height: 8, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>{m.desc}</p>
                  {savings > 0 && (
                      <p style={{ fontSize: 12, color: "#b45309", fontWeight: 600, marginBottom: 8 }}>
                        {t.extraCost.replace("{v}", savings.toFixed(2))}
                      </p>
                  )}
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>{t.pros}</div>
                      {m.pros.map((p, i) => <div key={i} style={{ fontSize: 12, color: "#374151" }}>✓ {p}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>{t.cons}</div>
                      {m.cons.map((c, i) => <div key={i} style={{ fontSize: 12, color: "#374151" }}>✗ {c}</div>)}
                    </div>
                  </div>
                </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, background: "#f1f5f9", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#475569" }}>
          <strong style={{ color: "#334155" }}>{t.priceRef}</strong>
          <span style={{ marginLeft: 16 }}>{t.onDemandPrice}</span>
          <span style={{ marginLeft: 16 }}>{t.spotPrice}</span>
          <span style={{ marginLeft: 16 }}>{t.excludeIdle}</span>
        </div>
      </div>
  );
}