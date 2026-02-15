# Visual Documentation and Mermaid Standards

## Principles
1. **Visualization First**: Complex logic, server flows, and architecture must be visualized using Mermaid diagrams to ensure rapid understanding.
2. **Contextual Placement**: Diagrams should be placed immediately following the relevant header (e.g., under "## Architecture" or "## Deployment Flow").

## Mermaid Diagram Requirements
- **Architecture**: Use `graph TD` or `flowchart TD` to show component relationships.
- **Processes/Sequences**: Use `sequenceDiagram` for request/response flows or multi-step operations.
- **Consistency**: Use consistent labels for components (e.g., if the server is "FastAPI" in one diagram, use "FastAPI" in all).

## Usage Standards
- Every `SYSTEM_DOCS.md` must contain at least one Architecture diagram.
- Every `MAINTENANCE.md` or `DEPLOYMENT_GUIDE` must contain a Deployment or Sequence diagram showing the flow.
- Diagrams must be contained within ` ```mermaid ` code blocks.

## ✅ Visual Checklist
- [ ] Is the diagram readable and correctly formatted?
- [ ] Does it accurately reflect the current code structure?
- [ ] Are the component names consistent with the documentation?
