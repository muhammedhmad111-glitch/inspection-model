import { createClient } from "@/lib/supabase/server";
import { getActiveLine } from "@/lib/production-line-server";
import {
  DashboardTabs,
  type AnalyticsData,
  type DashboardData,
} from "./dashboard-tabs";

export default async function HomePage() {
  const supabase = await createClient();
  const line = await getActiveLine();

  const [{ data: dash }, { data: analytics }] = await Promise.all([
    supabase.rpc("get_dashboard_data", { p_line: line }),
    supabase.rpc("get_analytics_data", { p_line: line }),
  ]);

  return (
    <DashboardTabs
      d={dash as unknown as DashboardData}
      a={analytics as unknown as AnalyticsData}
      line={line}
    />
  );
}
