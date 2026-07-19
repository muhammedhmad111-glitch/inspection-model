import { createClient } from "@/lib/supabase/server";
import {
  DashboardTabs,
  type AnalyticsData,
  type DashboardData,
} from "./dashboard-tabs";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: dash }, { data: analytics }] = await Promise.all([
    supabase.rpc("get_dashboard_data"),
    supabase.rpc("get_analytics_data"),
  ]);

  return (
    <DashboardTabs
      d={dash as unknown as DashboardData}
      a={analytics as unknown as AnalyticsData}
    />
  );
}
