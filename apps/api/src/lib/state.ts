import { demoState, type AppState } from "@sos-procuresphere/shared";

export const createInitialState = (): AppState => structuredClone(demoState);

let currentState = createInitialState();

export const getState = () => currentState;

export const setState = (updater: (state: AppState) => AppState): AppState => {
  currentState = updater(structuredClone(currentState));
  currentState.generatedAt = new Date().toISOString();
  return currentState;
};

export const resetState = (): AppState => {
  currentState = createInitialState();
  return currentState;
};
