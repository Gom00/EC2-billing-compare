import { useState } from "react";

const BUILD_TIME_OPTIONS = [10, 20, 30, 60];
const BUILDS_PER_DAY_OPTIONS = [1, 3, 5, 10];

const ON_DEMAND_HOURLY = 0.192;
const SPOT_HOURLY = 0.025;

function calcCost(hourly, buildMins, buildsPerDay, days = 22) {
  const hrs = (buildMins / 60) * buildsPerDay * days;
  return hourly * hrs;
}

const models = [
  {
    id: "spot",
    label: "Spot Only",
    badge: "최저 비용",
    badgeColor: "#16a34a",
    desc: "Spot 인스턴스만 사용. 가장 저렴하지만 AWS가 용량 회수 시 빌드 중단 위험.",
    pros: ["비용 최소화", "동일 스펙 대비 ~87% 절감"],
    cons: ["빌드 중단 가능성 (2분 전 알림)", "중단 시 처음부터 재시작", "긴 빌드일수록 위험"],
    get: (mins, perDay) => calcCost(SPOT_HOURLY, mins, perDay),
    color: "#dcfce7",
    border: "#86efac",
  },
  {
    id: "spot_fallback",
    label: "Spot + On-Demand 폴백",
    badge: "현재 권장",
    badgeColor: "#2563eb",
    desc: "Spot 우선 시도 → 실패 시 On-Demand로 자동 전환. 안정성과 비용의 균형.",
    pros: ["Spot 성공 시 비용 절감", "중단 없이 빌드 보장", "AWS Auto Scaling 지원"],
    cons: ["구성 복잡도 증가", "폴백 시 On-Demand 요금 적용", "인프라 코드 관리 필요"],
    get: (mins, perDay) =>
      calcCost(SPOT_HOURLY, mins, perDay) * 0.8 +
      calcCost(ON_DEMAND_HOURLY, mins, perDay) * 0.2,
    color: "#dbeafe",
    border: "#93c5fd",
  },
  {
    id: "ondemand",
    label: "On-Demand Only",
    badge: "가장 안정적",
    badgeColor: "#9333ea",
    desc: "On-Demand 인스턴스만 사용. 중단 없이 안정적이며 설정이 가장 단순.",
    pros: ["중단 위험 없음", "설정 단순", "예측 가능한 비용"],
    cons: ["비용이 가장 높음", "유연성 낮음"],
    get: (mins, perDay) => calcCost(ON_DEMAND_HOURLY, mins, perDay),
    color: "#f3e8ff",
    border: "#d8b4fe",
  },
];

export default function App() {
  const [buildMins, setBuildMins] = useState(30);
  const [buildsPerDay, setBuildsPerDay] = useState(3);

  const costs = models.map(m => ({ ...m, cost: m.get(buildMins, buildsPerDay) }));
  const minCost = Math.min(...costs.map(c => c.cost));
  const maxCost = Math.max(...costs.map(c => c.cost));

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 780, margin: "0 auto", padding: "24px 16px", color: "#111" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>EC2 과금 모델 비교</h2>
      <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>
        m7i-flex.xlarge (4vCPU / 16GB) · 서울 리전 기준
      </p>

      {/* 파라미터 */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>빌드 소요 시간</label>
          <div style={{ display: "flex", gap: 8 }}>
            {BUILD_TIME_OPTIONS.map(v => (
              <button key={v} onClick={() => setBuildMins(v)} style={{
                padding: "5px 12px", borderRadius: 6, border: "1.5px solid",
                borderColor: buildMins === v ? "#2563eb" : "#d1d5db",
                background: buildMins === v ? "#2563eb" : "#fff",
                color: buildMins === v ? "#fff" : "#374151",
                fontWeight: 600, fontSize: 13, cursor: "pointer"
              }}>{v}분</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>일 평균 빌드 횟수</label>
          <div style={{ display: "flex", gap: 8 }}>
            {BUILDS_PER_DAY_OPTIONS.map(v => (
              <button key={v} onClick={() => setBuildsPerDay(v)} style={{
                padding: "5px 12px", borderRadius: 6, border: "1.5px solid",
                borderColor: buildsPerDay === v ? "#2563eb" : "#d1d5db",
                background: buildsPerDay === v ? "#2563eb" : "#fff",
                color: buildsPerDay === v ? "#fff" : "#374151",
                fontWeight: 600, fontSize: 13, cursor: "pointer"
              }}>{v}회</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", alignSelf: "flex-end", paddingBottom: 2 }}>
          * 월 22 영업일 기준 · Spot 성공률 80% 가정
        </div>
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
                  ${m.cost.toFixed(2)}<span style={{ fontSize: 13, fontWeight: 400, color: "#555" }}>/월</span>
                </span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 99, height: 8, marginBottom: 10 }}>
                <div style={{ width: `${pct}%`, background: m.badgeColor, borderRadius: 99, height: 8, transition: "width 0.3s" }} />
              </div>
              <p style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>{m.desc}</p>
              {savings > 0 && (
                <p style={{ fontSize: 12, color: "#b45309", fontWeight: 600, marginBottom: 8 }}>
                  ※ Spot Only 대비 월 +${savings.toFixed(2)} 추가
                </p>
              )}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>장점</div>
                  {m.pros.map((p, i) => <div key={i} style={{ fontSize: 12, color: "#374151" }}>✓ {p}</div>)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>단점</div>
                  {m.cons.map((c, i) => <div key={i} style={{ fontSize: 12, color: "#374151" }}>✗ {c}</div>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, background: "#f1f5f9", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#475569" }}>
        <strong style={{ color: "#334155" }}>단가 참고</strong>
        <span style={{ marginLeft: 16 }}>On-Demand: $0.192/hr</span>
        <span style={{ marginLeft: 16 }}>Spot: ~$0.025/hr (서울 리전 추정)</span>
        <span style={{ marginLeft: 16 }}>빌드 외 대기 시간 비용 미포함</span>
      </div>
    </div>
  );
}