// App.tsx — Root component with React Router routing
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout         from "./components/Layout";
import Home           from "./pages/Home";
import LiveTranslator from "./pages/LiveTranslator";
import Dictionary     from "./pages/Dictionary";
import History        from "./pages/History";
import TextToSign     from "./pages/TextToSign";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index               element={<Home />}           />
          <Route path="translate"    element={<LiveTranslator />} />
          <Route path="dictionary"   element={<Dictionary />}     />
          <Route path="history"      element={<History />}        />
          <Route path="text-to-sign" element={<TextToSign />}     />
          <Route path="*"            element={<Home />}           />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
