import { addMeasured } from "./store";
import timeSpan from "time-span";

export default function measureTimeSpan(
  functionName: string
): { success: () => void; failed: () => void } {
  const end = timeSpan();
  function success() {
    addMeasured({ functionName, elapsedMillis: end(), success: true });
  }
  function failed() {
    addMeasured({ functionName, elapsedMillis: end(), success: false });
  }
  return { success, failed };
}
