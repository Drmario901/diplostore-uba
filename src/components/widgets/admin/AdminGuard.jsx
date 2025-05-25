import { useEffect, useState } from "react";
import axios from "axios";

const AdminGuard = ({ children }) => {
  const [allowed, setAllowed] = useState(null); // null = cargando, true = ok, false = no autorizado

  useEffect(() => {
    const validate = async () => {
      try {
        const token = localStorage.getItem("auth_token");

        if (!token) {
          console.warn("No token found");
          setAllowed(false);
          return;
        }

        const res = await axios.post("https://diplostore.fwh.is/diplo-store-api/api/validate", { token });

        if (res.data.admin === true) {
          setAllowed(true);
        } else {
          console.warn("Response received but not admin", res.data);
          setAllowed(false);
        }
      } catch (error) {
        console.error("Validation failed", error.response?.data || error.message);
        setAllowed(false);
      }
    };

    validate();
  }, []);

  if (allowed === null) {
    return <p style={{ textAlign: "center" }}>Verificando acceso de administrador...</p>;
  }

  if (!allowed) {
    window.location.href = "https://diplostore.fwh.is/login"; 
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
