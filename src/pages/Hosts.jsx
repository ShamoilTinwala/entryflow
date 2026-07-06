import Layout from "../components/Layout";
import HostCard from "../components/HostCard";
import { hosts } from "../data/mockData";

function Hosts() {
  return (
    <Layout title="Hosts">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          All Hosts
        </h2>

        <button className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700">
          + Add Host
        </button>

      </div>

      <div className="space-y-4">

        {hosts.map((host) => (
          <HostCard
            key={host.id}
            host={host}
          />
        ))}

      </div>

    </Layout>
  );
}

export default Hosts;