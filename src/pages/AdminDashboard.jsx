import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import { dashboardStats } from "../data/mockData";

function AdminDashboard() {
  return (
    <Layout title="Admin Dashboard">
      <div className="grid grid-cols-3 gap-6">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>
    </Layout>
  );
}

export default AdminDashboard;