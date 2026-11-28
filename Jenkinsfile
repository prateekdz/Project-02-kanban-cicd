pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME     = 'prateekdz/kanban-dashboard'
        CONTAINER_PORT = '8080'
        PUBLIC_URL     = 'http://16.4.49.225'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh '''
                    npm ci
                    npm run lint
                    npm run build
                '''
            }
        }

        // 1. Build a Docker image & 2. Generate image tags from build number and commit SHA
        stage('Build & Tag') {
            steps {
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
                }
                sh '''
                    docker build --pull \
                        --tag "$IMAGE_NAME:$BUILD_NUMBER" \
                        --tag "$IMAGE_NAME:$GIT_SHA" .
                '''
            }
        }

        stage('Scan') {
            steps {
                sh '''
                    docker run --rm \
                        --volume "$WORKSPACE:/repo:ro" \
                        zricethezav/gitleaks:v8.24.3 \
                        detect --source=/repo --redact

                    docker run --rm \
                        --volume /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:0.59.1 \
                        image --exit-code 1 --severity HIGH,CRITICAL \
                        "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        // 3. Log in to Docker Hub & 4. Push both image tags
        stage('Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USERNAME',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set +x
                        printf '%s' "$DOCKERHUB_TOKEN" | docker login --username "$DOCKERHUB_USERNAME" --password-stdin
                        trap 'docker logout >/dev/null 2>&1 || true' EXIT
                        docker push "$IMAGE_NAME:$BUILD_NUMBER"
                        docker push "$IMAGE_NAME:$GIT_SHA"
                    '''
                }
            }
        }

        // Steps 5 through 11: Pull, Start with limits, Health Check, Nginx Switch, Public URL Check, Stop Old
        stage('Deploy & Switch Traffic') {
            steps {
                script {
                    def activePort = sh(
                        script: "grep -oE '808[12]' /etc/nginx/conf.d/kanban.conf 2>/dev/null | head -n1 || echo ''",
                        returnStdout: true
                    ).trim()

                    def newPort = (activePort == '8081') ? '8082' : '8081'
                    env.OLD_CONTAINER = activePort ? "kanban-${activePort}" : ''
                    env.NEW_CONTAINER = "kanban-${newPort}"
                    env.NEW_PORT      = newPort
                }

                // 5. Pull new image on EC2, 6. Start new container, 7. Apply CPU and memory limits
                sh '''
                    set -eu
                    docker pull "$IMAGE_NAME:$BUILD_NUMBER"
                    docker rm -f "$NEW_CONTAINER" 2>/dev/null || true

                    docker run -d \
                        --name "$NEW_CONTAINER" \
                        --restart unless-stopped \
                        --memory=512m \
                        --cpus=1.0 \
                        -p "127.0.0.1:${NEW_PORT}:${CONTAINER_PORT}" \
                        "$IMAGE_NAME:$BUILD_NUMBER"
                '''

                // 8. Verify the new container's health
                sh '''
                    set -eu
                    for i in $(seq 1 20); do
                        if curl -fsS "http://127.0.0.1:${NEW_PORT}/" >/dev/null; then
                            echo "Health check passed for ${NEW_CONTAINER} on port ${NEW_PORT}"
                            exit 0
                        fi
                        sleep 2
                    done
                    echo "Health check failed for ${NEW_CONTAINER}; rolling back" >&2
                    docker logs "$NEW_CONTAINER" || true
                    docker rm -f "$NEW_CONTAINER" || true
                    exit 1
                '''

                // 9. Switch Nginx traffic to the new container
                sh '''
                    set -eu
                    printf 'server {\n    listen 80;\n    server_name _;\n    location / {\n        proxy_pass http://127.0.0.1:%s;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n}\n' "${NEW_PORT}" | sudo tee /etc/nginx/conf.d/kanban.conf >/dev/null
                    sudo nginx -t
                    sudo systemctl reload nginx
                '''

                // 10. Confirm public URL works & 11. Stop old container only after success
                sh '''
                    set -eu
                    curl -fsS "${PUBLIC_URL}/" >/dev/null
                    echo "Public URL ${PUBLIC_URL} verified!"

                    if [ -n "${OLD_CONTAINER:-}" ] && [ "${OLD_CONTAINER}" != "${NEW_CONTAINER}" ]; then
                        docker stop "$OLD_CONTAINER" || true
                        docker rm "$OLD_CONTAINER" || true
                        echo "Stopped and removed old container ${OLD_CONTAINER}"
                    fi
                '''
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
    }
}
