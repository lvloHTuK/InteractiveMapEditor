import { useState } from "react";
import "./index.css";
import ProjectList from "./components/ProjectList";
import MapEditor from "./components/MapEditor";

function App() {
  const [projectId, setProjectId] = useState<string | null>(null);

  if (projectId) {
    return <MapEditor projectId={projectId} onBack={() => setProjectId(null)} />;
  }

  return <ProjectList onOpen={(id) => setProjectId(id)} />;
}

export default App;
