import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SelectedCollege = { id: number; name: string; code: string; location: string | null; description: string | null };

type CollegeContextValue = {
  college: SelectedCollege | null;
  selectCollege: (college: SelectedCollege) => void;
  clearCollege: () => void;
};

const CollegeContext = createContext<CollegeContextValue | undefined>(undefined);
const COLLEGE_STORAGE_KEY = "campus-helpdesk:selected-college";

export function CollegeProvider({ children }: { children: ReactNode }) {
  const [college, setCollege] = useState<SelectedCollege | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLEGE_STORAGE_KEY);
      if (stored) setCollege(JSON.parse(stored) as SelectedCollege);
    } catch {
      window.localStorage.removeItem(COLLEGE_STORAGE_KEY);
    }
  }, []);

  const selectCollege = (nextCollege: SelectedCollege) => {
    setCollege(nextCollege);
    window.localStorage.setItem(COLLEGE_STORAGE_KEY, JSON.stringify(nextCollege));
  };
  const clearCollege = () => {
    setCollege(null);
    window.localStorage.removeItem(COLLEGE_STORAGE_KEY);
  };

  return <CollegeContext.Provider value={{ college, selectCollege, clearCollege }}>{children}</CollegeContext.Provider>;
}

export function useCollege() {
  const context = useContext(CollegeContext);
  if (!context) throw new Error("useCollege must be used within CollegeProvider");
  return context;
}
