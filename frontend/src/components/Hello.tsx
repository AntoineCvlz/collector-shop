import { useQuery } from "@tanstack/react-query";
import { fetchHello } from "../services/hello.service";

export default function Hello() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["hello-world"], // Clé unique pour le cache
    queryFn: fetchHello,       // Ta fonction fetch
  });

  if (isLoading) return <p>Chargement...</p>;
  
  if (error) return <p className="text-red-500">Erreur : {error.message}</p>;

  return (
    <h1 className="text-2xl font-bold">
      {data?.message}
    </h1>
  );
}