# Docker security scan evidence

## Evidence status: Not supplied

No genuine Gitleaks or Trivy scan output was included with the supplied screenshots. This folder contains no scan-result images; that absence does not mean a scan passed.

## Checks configured in Jenkins

The [`Jenkinsfile`](../../Jenkinsfile) runs a **Scan** stage after building the image and before publishing it:

| Scanner | Target | Pipeline behavior |
| --- | --- | --- |
| Gitleaks `v8.24.3` | Checked-out workspace, mounted read-only | Scans with `detect --redact`; detected secrets fail the command. |
| Trivy `0.59.1` | Image tagged with the Jenkins build number | Scans HIGH and CRITICAL findings; `--exit-code 1` fails the stage when either severity is found. |

These are pipeline configuration details, not proof that the scans ran successfully for a particular build. No scan result or build-specific status is available in this evidence folder.

## Completing the evidence

To add evidence, capture the actual Jenkins console output for a run of the **Scan** stage. Include the build number, commit, image tag, scanner output, and final stage result. Remove passwords, access tokens, private keys, and other credentials. Do not create or label a result screenshot unless it came from a real scan run.

For the complete screenshot inventory, see the [screenshots index](../README.md) and [deployment evidence index](../../evidence/README.md).
