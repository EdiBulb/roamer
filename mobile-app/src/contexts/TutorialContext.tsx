import { createContext, useContext, useState, ReactNode } from 'react';

// Steps: 0=Journey tab, 1=Distance, 2=Generate, 3=StartRun, 4=done
export const TUTORIAL_STEPS = 4;

interface TutorialContextValue {
  currentStep: number;
  isActive: boolean;
  advance: (fromStep: number) => void;
  skip: () => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  currentStep: 0,
  isActive: false,
  advance: () => {},
  skip: () => {},
});

interface Props {
  active: boolean;
  onFinish: () => void;
  children: ReactNode;
}

export function TutorialProvider({ active, onFinish, children }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  function advance(fromStep: number) {
    if (currentStep !== fromStep) return;
    const next = fromStep + 1;
    if (next >= TUTORIAL_STEPS) {
      onFinish();
    } else {
      setCurrentStep(next);
    }
  }

  function skip() {
    onFinish();
  }

  return (
    <TutorialContext.Provider value={{ currentStep, isActive: active, advance, skip }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
