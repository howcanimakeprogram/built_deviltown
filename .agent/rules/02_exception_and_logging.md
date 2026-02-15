# Exception Handling, Logging, and Observability

## Exception Handling
1. **Standardized Messages**: Error messages must reveal "Action / Reason for failure / Next step".
2. **External I/O Protection**: All network, file, DB, and API operations must use try-except blocks with clear failure paths.
3. **WHY Comments**: Prioritize commenting "why" a logic exists. "What" and "How" should be evident from the code.

## Logging Standards
1. **No Print Statements**: Use standard logging libraries. Avoid `print()`.
2. **Log Levels**:
    - `info`: Key stages of normal flow.
    - `warning`: Recoverable issues or data anomalies.
    - `error`: Failed operations (including retry/abort).
    - `debug`: Detailed troubleshooting (disabled by default).
3. **PII Masking**: Never log tokens, passwords, cookies, or personal identifiers. Mask them.

## Logging Format Standard
1. **Job ID**: Every task must generate a unique `job_id`.
2. **Required Fields**:
    - `job_id`
    - Main identifier (e.g., booking number)
    - `step` (current phase)
    - `count` (number of items processed)
    - `duration_ms` (time taken)
    - `status` (success/fail)
    - `error_message` (if applicable)
3. **Format Example**:
    `[INFO] job_id=20260215-001 step=fetch_data status=success duration_ms=842`
