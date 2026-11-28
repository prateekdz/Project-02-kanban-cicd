# Screenshots and evidence

This is the single image store. The `evidence/` directory contains stage-based indexes that link here, avoiding duplicate image copies. This gallery lists only screenshots that are currently present.

## Main application layout

![Original Kanban Task Manager layout](./01-local-application/01-local-application.png)

This supplied local application screenshot represents the primary project layout.

## Retained screenshots

The following 17 retained captures are linked from the stage-based evidence indexes. The project-structure and local HTTP-response screenshots, along with the supplemental Boardly preview, are no longer included.

| Capture | Screenshot |
| --- | --- |
| Primary local application | [01-local-application.png](./01-local-application/01-local-application.png) |
| Vite development server | [02-vite-dev-server.png](./01-local-application/02-vite-dev-server.png) |
| Local browser | [03-local-browser.png](./01-local-application/03-local-browser.png) |
| Task interaction | [04-task-interaction.png](./01-local-application/04-task-interaction.png) |
| Docker engine smoke test | [01-docker-engine-smoke-test.png](./02-docker-build/01-docker-engine-smoke-test.png) |
| Docker Hub repository tag | [01-dockerhub-repository-tag.png](./04-docker-hub/01-dockerhub-repository-tag.png) |
| EC2 shell | [01-ec2-shell.png](./05-aws-ec2/01-ec2-shell.png) |
| Docker service status | [02-docker-service-active.png](./05-aws-ec2/02-docker-service-active.png) |
| Container resource usage | [03-container-resource-usage.png](./05-aws-ec2/03-container-resource-usage.png) |
| Jenkins unlock screen | [01-jenkins-unlock-screen.png](./06-jenkins/01-jenkins-unlock-screen.png) |
| Jenkins dashboard | [02-jenkins-dashboard.png](./06-jenkins/02-jenkins-dashboard.png) |
| Successful build console | [01-console-success.png](./08-pipeline-success/01-console-success.png) |
| Successful build details | [02-successful-build-details.png](./08-pipeline-success/02-successful-build-details.png) |
| Failed build history | [01-build-history-with-failed-run.png](./09-pipeline-failure/01-build-history-with-failed-run.png) |
| Webhook status | [01-webhook-not-triggered.png](./07-github-webhook/01-webhook-not-triggered.png) |
| Green container HTTP check | [01-green-container-http-200.png](./10-health-check/01-green-container-http-200.png) |
| Live application | [01-live-application.png](./12-live-application/01-live-application.png) |

## Evidence status

- The Docker CLI screenshot shows an engine/Hello World check, not a build of this project image.
- No Gitleaks or Trivy scan screenshot was supplied.
- The webhook screenshot says the hook had never been triggered at capture time.
- Build screenshots are historical and do not prove that the current source revision was deployed.
- No dedicated rollback-test screenshot was supplied.
- The live-app and EC2 screenshots are capture-time evidence, not continuous monitoring.

The missing security-scan and rollback captures are recorded in the corresponding folders as unavailable; no evidence has been fabricated.
