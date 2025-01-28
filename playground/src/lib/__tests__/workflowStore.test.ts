import { useWorkflowStore } from "../workflowStore";

describe("workflowStore", () => {
  describe("resolveRuntimeExpression", () => {
    const { resolveRuntimeExpression, setInputValue, setStepResult, setOutputValue } = useWorkflowStore.getState();

    beforeEach(() => {
      useWorkflowStore.setState({
        inputValues: {},
        workflowState: {},
        outputValues: {},
      });
    });

    describe("$inputs", () => {
      it("resolves input values", () => {
        setInputValue("apiKey", "test-key");
        expect(resolveRuntimeExpression("$inputs.apiKey")).toBe("test-key");
      });

      it("returns original expression if input not found", () => {
        expect(resolveRuntimeExpression("$inputs.notFound")).toBe("$inputs.notFound");
      });
    });

    describe("$steps", () => {
      beforeEach(() => {
        setStepResult("getEvents", {
          data: {
            events: [
              { id: "123", title: "Meeting" },
              { id: "456", title: "Lunch" }
            ]
          },
          outputs: {
            eventId: "123"
          }
        });
      });

      it("resolves simple step result paths", () => {
        expect(resolveRuntimeExpression("$steps.getEvents.outputs.eventId")).toBe("123");
      });

      it("resolves array indexing", () => {
        expect(resolveRuntimeExpression("$steps.getEvents.data.events[0].id")).toBe("123");
        expect(resolveRuntimeExpression("$steps.getEvents.data.events[1].title")).toBe("Lunch");
      });

      it("resolves nested paths", () => {
        expect(resolveRuntimeExpression("$steps.getEvents.data.events[0].title")).toBe("Meeting");
      });

      it("returns original expression if step not found", () => {
        expect(resolveRuntimeExpression("$steps.notFound.data")).toBe("$steps.notFound.data");
      });

      it("returns original expression if path not found", () => {
        expect(resolveRuntimeExpression("$steps.getEvents.invalid.path")).toBe("$steps.getEvents.invalid.path");
      });
    });

    describe("$response", () => {
      beforeEach(() => {
        setStepResult("createEvent", {
          data: {
            calendar_event_id: "789",
            details: {
              location: "Office"
            }
          },
          headers: {
            "content-type": "application/json"
          }
        });
      });

      it("resolves response body paths", () => {
        expect(resolveRuntimeExpression("$response.body#/calendar_event_id")).toBe("789");
        expect(resolveRuntimeExpression("$response.body#/details/location")).toBe("Office");
      });

      it("resolves response header paths", () => {
        expect(resolveRuntimeExpression("$response.headers#/content-type")).toBe("application/json");
      });

      it("returns original expression if path not found", () => {
        expect(resolveRuntimeExpression("$response.body#/invalid/path")).toBe("$response.body#/invalid/path");
      });
    });

    describe("$outputs", () => {
      it("resolves output values", () => {
        setOutputValue("eventId", "123");
        expect(resolveRuntimeExpression("$outputs.eventId")).toBe("123");
      });

      it("returns original expression if output not found", () => {
        expect(resolveRuntimeExpression("$outputs.notFound")).toBe("$outputs.notFound");
      });
    });

    describe("non-expressions", () => {
      it("returns non-expression values as is", () => {
        expect(resolveRuntimeExpression("plain value")).toBe("plain value");
        expect(resolveRuntimeExpression("123")).toBe("123");
      });
    });
  });
}); 