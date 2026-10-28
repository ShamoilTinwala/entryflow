import { useParams } from "react-router-dom";
import HostPasses from "./HostPasses";
function HostDetail() {
  const { id } = useParams();
  return <HostPasses hostId={Number(id)} />;
}
export default HostDetail;
