import { GrahaChart } from "./components/GrahaChart";

export default function App() {
  return (
    <div className="app">
      <div className="stars" aria-hidden="true" />
      <div className="stars stars--layer2" aria-hidden="true" />
      <GrahaChart />
    </div>
  );
}
