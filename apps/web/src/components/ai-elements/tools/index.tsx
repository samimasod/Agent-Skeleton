export interface ToolDisplayConfig {
  running: string;
  completed: string;
  mode?: "collapsible" | "inline" | "both";
}

export const toolDisplayLabels: Record<string, ToolDisplayConfig> = {
  "get_weather": {
    running: "Finding weather...",
    completed: "Found weather",
    mode: "inline"
  },
  "get_stock_price": {
    running: "Fetching market price...",
    completed: "Retrieved stock price",
    mode: "inline"
  },
  "calculate_mortgage": {
    running: "Calculating mortgage payments...",
    completed: "Mortgage calculated",
    mode: "inline"
  },
  "search_web": {
    running: "Searching the web...",
    completed: "Web search complete",
    mode: "collapsible"
  },
  "read_file": {
    running: "Reading file contents...",
    completed: "File read successfully",
    mode: "collapsible"
  },
  "fetch_user_profile": {
    running: "Fetching user profile...",
    completed: "Profile loaded",
    mode: "both"
  }
};

export function WeatherCard({ data }: { data: any }) {
  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-4 shadow-sm min-w-[280px]">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-foreground">{data.city || "Location"}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{data.condition || "Clear"}</p>
        </div>
        <span className="text-xl">☀️</span>
      </div>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">{data.temperature || "20°C"}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
        <div>
          <span>Humidity</span>
          <p className="font-semibold text-foreground mt-0.5">{data.humidity || "50%"}</p>
        </div>
        <div>
          <span>Wind Speed</span>
          <p className="font-semibold text-foreground mt-0.5">{data.wind || "10 km/h"}</p>
        </div>
      </div>
    </div>
  );
}

export function StockWidget({ data }: { data: any }) {
  const isPositive = !data.change?.toString().startsWith("-");
  return (
    <div className="mt-2 rounded-2xl border border-border bg-card p-4 min-w-[280px] shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{data.symbol || "AAPL"}</span>
          <h4 className="text-sm font-semibold text-foreground mt-0.5">{data.company || "Company"}</h4>
        </div>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${
          isPositive ? "bg-[rgba(88,132,79,0.14)] text-[var(--positive)]" : "bg-destructive/10 text-destructive"
        }`}>
          {isPositive ? "+" : ""}{data.change || "0.0%"}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold font-mono text-foreground">${data.price || "150.00"}</span>
        <span className="text-[10px] text-muted-foreground">USD</span>
      </div>
    </div>
  );
}

export function KeyValueDataCard({ name, data }: { name: string; data: Record<string, any> }) {
  return (
    <div className="mt-2 rounded-xl border border-sidebar-border bg-sidebar/20 p-3 text-xs w-full max-w-[340px] shadow-sm">
      <div className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b border-sidebar-border/40">
        {name.replace(/_/g, " ")} Result
      </div>
      <div className="space-y-1.5">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex justify-between items-center text-xs py-0.5 border-b border-sidebar-border/20 last:border-0">
            <span className="font-semibold text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
            <span className="font-mono text-foreground font-medium ml-2 text-right">
              {typeof val === "object" ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenerativeToolUi({ name, content }: { name: string; content: string }) {
  try {
    const data = JSON.parse(content);

    if (name === "get_weather") {
      return <WeatherCard data={data} />;
    }

    if (name === "get_stock_price") {
      return <StockWidget data={data} />;
    }

    // Auto-Generated Key-Value Data Card Fallback for any unknown tool returning JSON
    if (typeof data === "object" && data !== null) {
      return <KeyValueDataCard name={name} data={data} />;
    }
  } catch (err) {
    // String output fallback
  }

  return (
    <details className="mt-1 text-xs w-full bg-sidebar/20 border border-sidebar-border rounded-md">
      <summary className="px-2 py-1 select-none cursor-pointer font-medium hover:bg-sidebar/35">
        Show returned value
      </summary>
      <pre className="p-2 border-t border-sidebar-border overflow-x-auto text-[11px] font-mono whitespace-pre-wrap max-h-48 text-muted-foreground">
        {content}
      </pre>
    </details>
  );
}
