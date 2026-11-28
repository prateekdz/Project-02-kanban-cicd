# Docker security scan evidence

## Evidence status: unavailable

This folder contains no scan-result screenshots or exported logs. That means scan results are **not evidenced here**; it does not mean a scan passed or failed.

## Jenkins scan configuration

The [Jenkinsfile](../../Jenkinsfile) defines a **Scan** stage after the image is built and before it is published:

| Scanner | Target | Configured result |
| --- | --- | --- |
| Gitleaks `v8.24.3` | Checked-out workspace, mounted read-only | Runs `detect --source=/repo --redact`; detected secrets fail the command. |
| Trivy `0.59.1` | Image tagged with the Jenkins build number | Checks HIGH and CRITICAL findings; `--exit-code 1` fails the command when either severity is found. |

This describes pipeline configuration only. It does not verify that either scanner ran successfully for a specific build.

## Evidence needed

For a real scan run, save the Jenkins console output showing the build number, commit SHA, image tag, both scanner results, and the final **Scan** stage status. Redact passwords, access tokens, private keys, and other credentials. Only label a capture as a successful scan when the actual output shows that result.

See the [screenshots index](../README.md) for the full image inventory and the [deployment evidence index](../../evidence/README.md) for stage-by-stage status.
