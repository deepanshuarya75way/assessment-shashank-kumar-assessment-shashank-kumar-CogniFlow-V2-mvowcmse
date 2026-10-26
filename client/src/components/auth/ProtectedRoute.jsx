import { Navigate } from "react-router-dom";
import { getAuthToken } from "../../utils/authStorage";

const ProtectedRoute = ({children}) => {
  const token = getAuthToken();

  if(!token){
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;