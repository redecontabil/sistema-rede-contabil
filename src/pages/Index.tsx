
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("Redirecionando para o Dashboard...");
    navigate("/dashboard");
  }, [navigate]);

  return null;
};

export default Index;
