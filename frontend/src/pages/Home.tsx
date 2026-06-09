import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import Hello from "../components/Hello";
import { clearSession, getUser, isAuthenticated } from "../lib/auth";

export default function Home() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <Hello />
      {isAuthenticated() ? (
        <>
          <p className="text-sm text-muted-foreground">
            Connecté en tant que {user?.email}
          </p>
          <Button variant="outline" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </>
      ) : (
        <Button onClick={() => navigate("/login")}>Se connecter</Button>
      )}
    </div>
  );
}
