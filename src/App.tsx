// App.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

/**
 * SCADA Mock - Single-file App.tsx (TypeScript)
 * - Estilo profissional, múltiplos painéis (Temperatura, Vazão, Pressão, Nível, Bombas, Ventiladores, Alarmes, KPIs)
 * - Simulação local de dados (atualiza a cada 2s)
 * - Recharts para gráficos (adicione 'recharts' nas dependências do sandbox)
 */

/* -------------------------
   Types
   ------------------------- */
type Point = { time: string; value: number };
type Alarm = { type: string; value: number | string; time: string };

/* -------------------------
   Helpers
   ------------------------- */
function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString();
}
function pushSeries(
  setter: React.Dispatch<React.SetStateAction<Point[]>>,
  point: Point,
  max = 40
) {
  setter((s) => {
    const next = [...s.slice(-max + 1), point];
    return next;
  });
}
function genSeed(n: number, avg: number, vari: number) {
  const out: Point[] = [];
  for (let i = 0; i < n; i++)
    out.push({
      time: `${i}`,
      value: Number((avg + (Math.random() - 0.5) * vari).toFixed(2)),
    });
  return out;
}

/* -------------------------
   App
   ------------------------- */
export default function App(): JSX.Element {
  // Data streams
  const [tempSeries, setTempSeries] = useState<Point[]>(() =>
    genSeed(24, 30, 6)
  );
  const [flowSeries, setFlowSeries] = useState<Point[]>(() =>
    genSeed(24, 145, 30)
  );
  const [pressSeries, setPressSeries] = useState<Point[]>(() =>
    genSeed(24, 2.1, 0.6)
  );
  const [levelSeries, setLevelSeries] = useState<Point[]>(() =>
    genSeed(24, 60, 18)
  );

  // Instant values for readouts
  const [tIn, setTIn] = useState<number>(72);
  const [tOut, setTOut] = useState<number>(30);
  const [flow, setFlow] = useState<number>(150);
  const [press, setPress] = useState<number>(2.1);
  const [level, setLevel] = useState<number>(60);

  // Equipment
  const [pumpOn, setPumpOn] = useState<boolean>(true);
  const [fanOn, setFanOn] = useState<boolean>(true);

  // Comms (simuladas)
  const [ethConnected, setEthConnected] = useState<boolean>(true);
  const [modbusConnected, setModbusConnected] = useState<boolean>(false);

  // Alarms
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  // Setpoints
  const [setpoints, setSetpoints] = useState({
    tempHigh: 78,
    flowLow: 130,
    pressHigh: 2.4,
    levelLow: 20,
    levelHigh: 90,
  });

  // KPIs
  const kpis = useMemo(() => {
    const dt = Number((tIn - tOut).toFixed(2));
    const efficiency = Math.max(
      0.5,
      Math.min(0.98, 0.85 - Math.random() * 0.12)
    );
    const cop = Number((2.5 + Math.random() * 1.6).toFixed(2));
    return { dt, efficiency, cop };
  }, [tIn, tOut, flow, press, level]);

  // Simulação de atualização a cada 2s
  useEffect(() => {
    const id = setInterval(() => {
      const time = nowLabel();

      // Simular temperatura influente e efluente
      const newTIn = 70 + Math.random() * 15; // 70..85
      const newTOut = Math.max(15, newTIn - (8 + Math.random() * 20)); // cooler than inlet
      const newTempAvg = Number(((newTIn + newTOut) / 2).toFixed(2));
      const newFlow = Number((120 + Math.random() * 60).toFixed(2));
      const newPress = Number((1.6 + Math.random() * 1.2).toFixed(2));
      const newLevel = Number((30 + Math.random() * 55).toFixed(2));

      // push series
      pushSeries(setTempSeries, { time, value: newTempAvg });
      pushSeries(setFlowSeries, { time, value: newFlow });
      pushSeries(setPressSeries, { time, value: newPress });
      pushSeries(setLevelSeries, { time, value: newLevel });

      // instant values
      setTIn(Number(newTIn.toFixed(2)));
      setTOut(Number(newTOut.toFixed(2)));
      setFlow(newFlow);
      setPress(newPress);
      setLevel(newLevel);

      // Alarme logic
      const newAlarms: Alarm[] = [];
      if (newTempAvg > setpoints.tempHigh)
        newAlarms.push({
          type: "Alta Temperatura",
          value: Number(newTempAvg.toFixed(2)),
          time,
        });
      if (newFlow < setpoints.flowLow)
        newAlarms.push({
          type: "Baixa Vazão",
          value: Number(newFlow.toFixed(2)),
          time,
        });
      if (newPress > setpoints.pressHigh)
        newAlarms.push({
          type: "Pressão Elevada",
          value: Number(newPress.toFixed(2)),
          time,
        });
      if (newLevel < setpoints.levelLow)
        newAlarms.push({
          type: "Nível Baixo",
          value: Number(newLevel.toFixed(2)),
          time,
        });
      if (newLevel > setpoints.levelHigh)
        newAlarms.push({
          type: "Nível Alto",
          value: Number(newLevel.toFixed(2)),
          time,
        });

      if (newAlarms.length) {
        setAlarms((a) => [...newAlarms, ...a].slice(0, 40));
      } else {
        // decay old alarms slowly (demo)
        setAlarms((a) => a.slice(0, 40));
      }
    }, 2000);
    return () => clearInterval(id);
  }, [setpoints]);

  /* -------------------------
     UI layout & styles (inline for single-file)
     ------------------------- */
  const containerStyle: React.CSSProperties = {
    fontFamily:
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    background: "#f6fbff",
    minHeight: "100vh",
    padding: 24,
  };
  const boardStyle: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };
  const headerStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 12,
  };
  const logoStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 12,
    background: "linear-gradient(135deg,#0078b5,#0a9fd6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
  };
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 16,
  };
  const card: React.CSSProperties = {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e6eef6",
    boxShadow: "0 6px 18px rgba(7,22,40,0.04)",
  };
  const smallCard: React.CSSProperties = { ...card, padding: 12 };
  const labelStyle: React.CSSProperties = { color: "#6b7280", fontSize: 13 };

  return (
    <div style={containerStyle}>
      <div style={boardStyle}>
        <header style={headerStyle}>
          <div style={logoStyle}>SCADA</div>
          <div>
            <h1 style={{ margin: 0 }}>SCADA — Mock Dashboard (Versão Única)</h1>
            <div style={{ color: "#6b7280" }}>
              Simulação para apresentação — não controlar equipamento real
            </div>
          </div>
        </header>

        <div style={gridStyle}>
          {/* Left column: main charts */}
          <main>
            {/* Overview / Readouts */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  ...smallCard,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={labelStyle}>Temperatura Entrada</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{tIn} °C</div>
                <div style={{ color: "#9aa7b5", fontSize: 12 }}>
                  Sensor: TT-101
                </div>
              </div>
              <div
                style={{
                  ...smallCard,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={labelStyle}>Temperatura Saída</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{tOut} °C</div>
                <div style={{ color: "#9aa7b5", fontSize: 12 }}>
                  Sensor: TT-102
                </div>
              </div>
              <div
                style={{
                  ...smallCard,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={labelStyle}>Vazão</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{flow} m³/h</div>
                <div style={{ color: "#9aa7b5", fontSize: 12 }}>
                  Sensor: FT-101
                </div>
              </div>
              <div
                style={{
                  ...smallCard,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={labelStyle}>Pressão</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{press} bar</div>
                <div style={{ color: "#9aa7b5", fontSize: 12 }}>
                  Sensor: PT-101
                </div>
              </div>
            </section>

            {/* Charts */}
            <section style={{ display: "grid", gap: 12 }}>
              <div style={{ ...card, minHeight: 220 }}>
                <h3 style={{ margin: "0 0 8px 0" }}>Temperatura (média)</h3>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0a9fd6"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div style={{ ...card, minHeight: 160 }}>
                  <h4 style={{ marginTop: 0 }}>Vazão</h4>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flowSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#1f9bd6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ ...card, minHeight: 160 }}>
                  <h4 style={{ marginTop: 0 }}>Pressão</h4>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pressSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3fb27f"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div style={{ ...card, minHeight: 140 }}>
                <h4 style={{ marginTop: 0 }}>Nível do Reservatório (%)</h4>
                <div style={{ height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={levelSeries}>
                      <defs>
                        <linearGradient
                          id="levelColor"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0a9fd6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0a9fd6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0a9fd6"
                        fill="url(#levelColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </main>

          {/* Right column: controls, alarms, kpis */}
          <aside>
            <div style={{ ...card, marginBottom: 12 }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Equipamentos</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    background: pumpOn ? "#eef7fb" : "#fff",
                    border: "1px solid #e6eef6",
                  }}
                >
                  <div style={{ color: "#0078b5", fontWeight: 700 }}>
                    Bombas
                  </div>
                  <div>{pumpOn ? "Ligadas" : "Desligadas"}</div>
                  <button
                    onClick={() => setPumpOn((s) => !s)}
                    style={{
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    {pumpOn ? "Desligar" : "Ligar"}
                  </button>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    background: fanOn ? "#eef7fb" : "#fff",
                    border: "1px solid #e6eef6",
                  }}
                >
                  <div style={{ color: "#0078b5", fontWeight: 700 }}>
                    Ventiladores
                  </div>
                  <div>{fanOn ? "Ligados" : "Desligados"}</div>
                  <button
                    onClick={() => setFanOn((s) => !s)}
                    style={{
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    {fanOn ? "Desligar" : "Ligar"}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={labelStyle}>EtherNet/IP</div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: ethConnected ? "green" : "red",
                    }}
                  >
                    {ethConnected ? "Conectado" : "Desconectado"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={labelStyle}>Modbus TCP</div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: modbusConnected ? "green" : "red",
                    }}
                  >
                    {modbusConnected ? "Conectado" : "Desconectado"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      setEthConnected(true);
                      setModbusConnected(false);
                    }}
                    style={{ padding: 8, cursor: "pointer" }}
                  >
                    Simular EtherNet/IP
                  </button>
                  <button
                    onClick={() => {
                      setEthConnected(false);
                      setModbusConnected(true);
                    }}
                    style={{ padding: 8, cursor: "pointer" }}
                  >
                    Simular Modbus
                  </button>
                </div>
              </div>
            </div>

            <div style={{ ...card, marginBottom: 12 }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Alarmes</h3>
              <div
                style={{
                  maxHeight: 240,
                  overflowY: "auto",
                  display: "grid",
                  gap: 8,
                }}
              >
                {alarms.length === 0 && (
                  <div style={{ color: "#6b7280" }}>Nenhum alarme ativo.</div>
                )}
                {alarms.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#ffecec",
                      border: "1px solid #f5c6cb",
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{a.type}</div>
                    <div>
                      Valor:{" "}
                      {typeof a.value === "number"
                        ? a.value.toFixed(2)
                        : a.value}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card }}>
              <h3 style={{ margin: "0 0 8px 0" }}>KPIs</h3>
              <div style={{ display: "grid", gap: 8 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#eef7fb",
                  }}
                >
                  <div style={{ color: "#0078b5", fontWeight: 700 }}>
                    ΔT (T_in - T_out)
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {kpis.dt} °C
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#eef7fb",
                  }}
                >
                  <div style={{ color: "#0078b5", fontWeight: 700 }}>
                    Eficiência
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {Math.round(kpis.efficiency * 100)} %
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#eef7fb",
                  }}
                >
                  <div style={{ color: "#0078b5", fontWeight: 700 }}>COP</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {kpis.cop}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom: Configuração e histórico resumido */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Configuração de Setpoints</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <label style={{ display: "block", color: "#6b7280" }}>
                  Temp. Máx (°C)
                </label>
                <input
                  type="number"
                  value={setpoints.tempHigh}
                  onChange={(e) =>
                    setSetpoints((s) => ({
                      ...s,
                      tempHigh: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #d5e6f3",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#6b7280" }}>
                  Vazão mínima (m³/h)
                </label>
                <input
                  type="number"
                  value={setpoints.flowLow}
                  onChange={(e) =>
                    setSetpoints((s) => ({
                      ...s,
                      flowLow: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #d5e6f3",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#6b7280" }}>
                  Pressão máx (bar)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={setpoints.pressHigh}
                  onChange={(e) =>
                    setSetpoints((s) => ({
                      ...s,
                      pressHigh: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #d5e6f3",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#6b7280" }}>
                  Nível mínimo (%)
                </label>
                <input
                  type="number"
                  value={setpoints.levelLow}
                  onChange={(e) =>
                    setSetpoints((s) => ({
                      ...s,
                      levelLow: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #d5e6f3",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#6b7280" }}>
                  Nível máximo (%)
                </label>
                <input
                  type="number"
                  value={setpoints.levelHigh}
                  onChange={(e) =>
                    setSetpoints((s) => ({
                      ...s,
                      levelHigh: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #d5e6f3",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={() => {
                    // simples feedback: limpa alarmes e adiciona uma linha de log (simples)
                    setAlarms([]);
                    alert("Setpoints aplicados com sucesso (simulado).");
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          <div style={{ ...card }}>
            <h3 style={{ marginTop: 0 }}>Histórico Recente (resumo)</h3>
            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ color: "#6b7280" }}>
                Últimos pontos de temperatura:{" "}
                {tempSeries.slice(-5).map((p, i) => (
                  <span key={i} style={{ marginRight: 8 }}>
                    {p.value.toFixed(1)}°C
                  </span>
                ))}
              </div>
              <div style={{ color: "#6b7280" }}>
                Últimos pontos de vazão:{" "}
                {flowSeries.slice(-5).map((p, i) => (
                  <span key={i} style={{ marginRight: 8 }}>
                    {p.value.toFixed(0)}
                  </span>
                ))}
              </div>
              <div style={{ color: "#6b7280" }}>
                Últimos pontos de pressão:{" "}
                {pressSeries.slice(-5).map((p, i) => (
                  <span key={i} style={{ marginRight: 8 }}>
                    {p.value.toFixed(2)}
                  </span>
                ))}
              </div>
              <div style={{ color: "#6b7280" }}>
                Últimos pontos de nível:{" "}
                {levelSeries.slice(-5).map((p, i) => (
                  <span key={i} style={{ marginRight: 8 }}>
                    {p.value.toFixed(0)}%
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => {
                    // limpar histórico (simulação)
                    setTempSeries(genSeed(24, 30, 6));
                    setFlowSeries(genSeed(24, 145, 30));
                    setPressSeries(genSeed(24, 2.1, 0.6));
                    setLevelSeries(genSeed(24, 60, 18));
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Resetar Histórico (simulado)
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer
          style={{ marginTop: 18, textAlign: "center", color: "#6b7280" }}
        >
          Desenvolvido para fins educacionais — SCADA Mock (não controlar
          equipamento real)
        </footer>
      </div>
    </div>
  );
}
