import { createContext, useContext, useEffect, useState } from "react";

type CollegeSelection = { id: number; name: string; code: string };
type CollegeContextValue = { college: CollegeSelection | null; selectCollege: (college: CollegeSelection) => void; clearCollege: () => void };
const CollegeContext = createContext<CollegeContextValue | null>(null);

export function CollegeProvider({ children }: { children: React.ReactNode }) {
  const [college, setCollege] = useState<CollegeSelection | null>(() => { try { const raw = localStorage.getItem("campus-helpdesk-college"); return raw ? JSON.parse(raw) : null; } catch { return null; } });
  useEffect(() => { try { if (college) localStorage.setItem("campus-helpdesk-college", JSON.stringify(college)); else localStorage.removeItem("campus-helpdesk-college"); } catch { /* storage is optional */ } }, [college]);
  return <CollegeContext.Provider value={{ college, selectCollege: setCollege, clearCollege: () => setCollege(null) }}>{children}</CollegeContext.Provider>;
}

export function useCollege() { const value = useContext(CollegeContext); if (!value) throw new Error("useCollege must be used inside CollegeProvider"); return value; }
