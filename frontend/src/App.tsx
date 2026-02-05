import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { Spinner } from "./components/ui/spinner";
import Hello from "./components/Hello";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-svh flex-col items-center justify-center">
        <Button>Click me</Button>
        <Spinner />
        <Hello />
      </div>
    </QueryClientProvider>
  );
}

export default App;
