import { flightRecorder } from '../qa/telemetry/flightRecorder';

export const telemetry = flightRecorder;
export type TelemetryTracker = typeof flightRecorder;
