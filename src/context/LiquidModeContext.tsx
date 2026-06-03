import { createContext, useContext } from 'react';

export const LiquidModeContext = createContext(false);

export function useLiquidMode() {
  return useContext(LiquidModeContext);
}
